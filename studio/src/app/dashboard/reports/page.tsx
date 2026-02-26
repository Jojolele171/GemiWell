'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { summarizeMedicalReport } from '@/ai/flows/summarize-medical-report';
import type { SummarizeMedicalReportOutput } from '@/ai/flows/summarize-medical-report';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, FileText, Activity, Camera, Upload, CheckCircle2, AlertCircle, Trash2, Zap, ImageIcon, X, Layers, Copy, ArrowLeft, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs as ModeTabs, TabsList as ModeTabsList, TabsTrigger as ModeTabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export const maxDuration = 60;

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_PHOTOS = 10;
// Firestore has a 1MB limit per document. 
// Base64 adds ~33% overhead, so we target < 700KB for the raw binary.
const FIRESTORE_LIMIT_BYTES = 1048487; 

async function compressImage(dataUri: string, maxWidth = 800, quality = 0.4): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUri;
  });
}

export default function ReportsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState('manual');
  const [scanMode, setScanMode] = useState<'single' | 'batch'>('single');
  const [reportText, setReportText] = useState('');
  const [summaryResult, setSummaryResult] = useState<SummarizeMedicalReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPatientMessage, setShowPatientMessage] = useState(false);
  
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [showImmersiveCamera, setShowImmersiveCamera] = useState(false);

  useEffect(() => {
    if (!isDetailOpen && !isDeleteDialogOpen && !isConfirmOpen && !showImmersiveCamera) {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, [isDetailOpen, isDeleteDialogOpen, isConfirmOpen, showImmersiveCamera]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowPatientMessage(true);
      }, 15000);
    } else {
      setShowPatientMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    let isMounted = true;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) setHasCameraPermission(false);
        return;
      }

      try {
        stopStream();
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
        
        if (isMounted) {
          setStream(s);
          setHasCameraPermission(true);
        } else {
          s.getTracks().forEach(t => t.stop());
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (isMounted) setHasCameraPermission(false);
      }
    };

    if (showImmersiveCamera || (activeTab === 'scan' && !isMobile)) {
      getCameraPermission();
    } else {
      stopStream();
    }

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [activeTab, showImmersiveCamera, isMobile]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const reportsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'reports'),
      orderBy('createdAt', 'desc')
    );
  }, [user, db]);

  const { data: reportsData, loading: reportsLoading } = useCollection(reportsQuery);
  const reports = reportsData || [];

  const handleProcessReport = async (payload: { reportText?: string; photoDataUris?: string[] }) => {
    if (!user || !db) return;
    setIsLoading(true);
    setSummaryResult(null);
    setIsConfirmOpen(false);
    setShowImmersiveCamera(false);

    try {
      let processedUris = payload.photoDataUris;
      if (processedUris && processedUris.length > 0) {
        processedUris = await Promise.all(
          processedUris.map(uri => uri.startsWith('data:application/pdf') ? uri : compressImage(uri, 800, 0.4))
        );
      }

      const result = await summarizeMedicalReport({
        reportText: payload.reportText,
        photoDataUris: processedUris,
        userName: user.displayName || 'User',
      });
      
      if (result.error) {
         toast({
           variant: 'destructive',
           title: 'Action Blocked',
           description: result.error,
         });
         setIsLoading(false);
         return;
      }
      
      setSummaryResult(result);

      const reportsRef = collection(db, 'users', user.uid, 'reports');
      
      // Determine what to store as reference. If the URI is too big for Firestore, we skip it.
      const primaryUri = processedUris?.[0] || null;
      const safeFileDataUri = (primaryUri && primaryUri.length < FIRESTORE_LIMIT_BYTES) ? primaryUri : null;

      if (primaryUri && primaryUri.length >= FIRESTORE_LIMIT_BYTES) {
        toast({
          variant: 'default',
          title: 'Attachment Too Large',
          description: 'AI analyzed your file, but it was too large to save for preview history.',
        });
      }

      addDoc(reportsRef, {
        originalText: payload.reportText || result.rawExtractedText || (processedUris ? `Captured from ${processedUris.length} attachments` : 'N/A'),
        summary: result.summary,
        confidence: result.confidenceLevel || 0,
        structuredData: result.structuredInsights || {},
        type: processedUris ? (processedUris.some(u => u.startsWith('data:application/pdf')) ? 'pdf' : (processedUris.length > 1 ? 'batch' : 'scan')) : 'manual',
        fileDataUri: safeFileDataUri,
        createdAt: serverTimestamp(),
        dateLabel: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      toast({
        title: 'Analysis Complete',
        description: 'Your report has been analyzed and saved.',
      });
      setReportText('');
      setCapturedImages([]);
    } catch (error: any) {
      console.error('Error processing report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your request. Try reducing file size or photo count.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState === 4) {
      if (capturedImages.length >= MAX_PHOTOS) {
        toast({
          variant: 'destructive',
          title: 'Limit Reached',
          description: `Only ${MAX_PHOTOS} photos are allowed.`,
        });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImages(prev => [...prev, dataUrl]);
        
        toast({
          title: 'Photo Captured',
          description: `Item ${capturedImages.length + 1} added to batch.`,
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `Max ${MAX_FILE_SIZE_MB}MB allowed.`,
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImages(prev => [...prev, dataUrl]);
        setIsConfirmOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCapturedImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    if (newImages.length === 0) {
      setIsConfirmOpen(false);
    }
  };

  const openReportDetail = (report: any) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!selectedReport || !user || !db) return;
    
    const reportId = selectedReport.id;
    setIsDeleteDialogOpen(false);
    setIsDetailOpen(false);
    setSelectedReport(null);

    setTimeout(async () => {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'reports', reportId));
        toast({
          title: 'Record Deleted',
          description: 'The health record has been removed.',
        });
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      } catch (err) {
        console.error("Deletion failed:", err);
      }
    }, 150);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Analysis copied to clipboard.',
    });
  };

  const isPdf = (uri: string) => uri?.startsWith('data:application/pdf');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Medical Reports</h1>
        <p className="text-muted-foreground">Manage and analyze your medical records with AI.</p>
      </div>

      <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "lg:grid-cols-5")}>
        <div className={cn("flex flex-col gap-6", isMobile ? "" : "lg:col-span-2")}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                <FileText className="size-5" />
                Analyze New Content
              </CardTitle>
              <CardDescription>
                AI extracts medical data from text, images, and PDFs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full rounded-none h-12">
                  <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
                  <TabsTrigger value="scan" className="flex-1">Scan & Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="p-6 space-y-4 m-0">
                  <Textarea
                    placeholder="Type or paste medical notes here..."
                    rows={10}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    disabled={isLoading}
                    className="resize-none"
                  />
                  <Button onClick={() => handleProcessReport({ reportText })} disabled={isLoading || !reportText.trim()} className="w-full h-12 font-bold">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Analyzing...' : 'Analyze Manually'}
                  </Button>
                </TabsContent>

                <TabsContent value="scan" className="p-6 space-y-4 m-0">
                  <div className="flex flex-col gap-4">
                    <ModeTabs value={scanMode} onValueChange={(v: any) => setScanMode(v)}>
                      <ModeTabsList className="grid w-full grid-cols-2">
                        <ModeTabsTrigger value="single" className="flex items-center gap-2">
                          <ImageIcon className="size-4" /> Single
                        </ModeTabsTrigger>
                        <ModeTabsTrigger value="batch" className="flex items-center gap-2">
                          <Layers className="size-4" /> Batch
                        </ModeTabsTrigger>
                      </ModeTabsList>
                    </ModeTabs>

                    {!isMobile ? (
                      <>
                        <div className="relative rounded-lg overflow-hidden border bg-black aspect-video flex items-center justify-center">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                          {hasCameraPermission === false && (
                            <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-4 text-center">
                              <AlertCircle className="size-10 text-destructive mb-2" />
                              <h4 className="font-semibold">Camera Access Required</h4>
                              <p className="text-sm text-muted-foreground mt-1">Please enable camera permissions.</p>
                            </div>
                          )}
                          <Button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full size-12 p-0 shadow-lg" disabled={capturedImages.length >= MAX_PHOTOS}>
                             <Camera size={24} />
                          </Button>
                        </div>
                        
                        {capturedImages.length > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                              <div 
                                className="size-12 rounded border bg-muted cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center overflow-hidden"
                                onClick={() => setIsConfirmOpen(true)}
                              >
                                {isPdf(capturedImages[capturedImages.length - 1]) ? (
                                  <FileText className="size-6 text-primary" />
                                ) : (
                                  <img src={capturedImages[capturedImages.length - 1]} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold uppercase tracking-tight">{capturedImages.length} captured</p>
                                <p className="text-[10px] text-muted-foreground">Max {MAX_PHOTOS} items</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(true)}>Review</Button>
                              <Button size="sm" onClick={() => handleProcessReport({ photoDataUris: capturedImages })} disabled={isLoading}>
                                {isLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : <Wand2 className="size-4 mr-1" />}
                                Analyze
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Button onClick={() => setShowImmersiveCamera(true)} className="w-full h-24 text-lg border-2 border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5">
                        <Camera className="mr-3 size-6" />
                        Launch Camera Scanner
                      </Button>
                    )}

                    <div className="relative mt-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or upload</span></div>
                    </div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 hover:bg-muted/50 transition-colors">
                        <Upload className="size-4" />
                        <span className="text-sm font-medium">Image or PDF (Max {MAX_FILE_SIZE_MB}MB)</span>
                      </div>
                      <input id="file-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isLoading} />
                    </Label>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {showPatientMessage && isLoading && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center animate-in fade-in slide-in-from-top-2 duration-500">
              <p className="text-sm font-bold text-primary">
                Please wait patiently as the AI takes time to help analyze the file to yield better result as in accuracy.
              </p>
            </div>
          )}
        </div>

        <div className={cn("space-y-6", isMobile ? "" : "lg:col-span-3")}>
          {(isLoading || summaryResult) && (
            <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl flex items-center gap-2 text-primary">
                  {isLoading ? <Loader2 className="size-6 animate-spin" /> : <CheckCircle2 className="size-6" />}
                  Analysis Result
                </CardTitle>
                {summaryResult?.summary && (
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(summaryResult.summary!)} className="font-bold">
                    <Copy className="size-4 mr-2" /> Copy
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {summaryResult && summaryResult.summary && (
                  <div className="space-y-6">
                    <div className="bg-background p-5 rounded-lg border shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{summaryResult.summary}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                        <span>Confidence Level</span>
                        <span>{((summaryResult.confidenceLevel || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(summaryResult.confidenceLevel || 0) * 100} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl">History</CardTitle>
                <CardDescription>Your analyzed records.</CardDescription>
              </div>
              <Badge variant="outline" className="px-3">{reports.length} Records</Badge>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : reports.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Summary</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reports.map((report: any) => (
                        <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openReportDetail(report)}>
                          <TableCell className="max-w-[300px] truncate font-medium">{report.summary}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{report.type || 'manual'}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{report.dateLabel}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <FileText className="size-16 mx-auto mb-4 opacity-20" />
                  <p>No reports analyzed yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isMobile && showImmersiveCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-4 h-20 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-20">
            <Button variant="ghost" className="text-white flex items-center gap-2" onClick={() => setShowImmersiveCamera(false)}>
              <ArrowLeft className="size-6" />
              <span className="font-bold">Go Back</span>
            </Button>
            <Badge variant="outline" className="border-white/40 text-white bg-white/10 uppercase text-[10px] px-3">
              {capturedImages.length} / {MAX_PHOTOS} items
            </Badge>
            <div className="w-10" />
          </div>

          <div className="flex-1 relative bg-black">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline />
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-8">
              <div className="w-full aspect-[3/4] border-2 border-white/20 rounded-3xl relative shadow-[0_0_0_2000px_rgba(0,0,0,0.4)]">
                <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
              </div>
            </div>
          </div>

          <div className="h-44 bg-black flex items-center justify-around px-4 shrink-0 z-20 border-t border-white/10">
            <div 
              className="flex flex-col items-center gap-1 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                if (capturedImages.length > 0) setIsConfirmOpen(true);
              }}
            >
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/20 overflow-hidden flex items-center justify-center relative active:scale-95 transition-transform">
                {capturedImages.length > 0 ? (
                  isPdf(capturedImages[capturedImages.length - 1]) ? (
                    <FileText className="text-white size-8" />
                  ) : (
                    <img src={capturedImages[capturedImages.length - 1]} className="w-full h-full object-cover" />
                  )
                ) : (
                  <ImageIcon className="text-white/20 size-6" />
                )}
                {capturedImages.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 size-6 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-black">
                    {capturedImages.length}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase text-center">Gallery</span>
            </div>
            
            <button onClick={capturePhoto} className="size-24 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-95 transition-transform" disabled={capturedImages.length >= MAX_PHOTOS}>
              <div className="size-full rounded-full bg-white shadow-xl" />
            </button>

            <div className="flex flex-col items-center gap-1">
              <Button 
                variant="ghost" 
                disabled={capturedImages.length === 0}
                className="text-primary font-black h-14 w-14 rounded-xl border border-primary/20 bg-primary/5 p-0 flex flex-col gap-1 hover:bg-primary/10 active:scale-95 transition-transform" 
                onClick={() => handleProcessReport({ photoDataUris: capturedImages })}
              >
                <Wand2 size={24} />
              </Button>
              <span className="text-[10px] text-primary/60 font-bold uppercase text-center">Analyze</span>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-none">
          <DialogHeader className="p-6 border-b bg-muted/20 shrink-0">
            <DialogTitle className="text-xl font-headline">Review Your Captures</DialogTitle>
            <DialogDescription>Ensure documents are readable before analyzing ({capturedImages.length}/{MAX_PHOTOS}).</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 touch-pan-y">
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              {capturedImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl border-2 border-muted overflow-hidden bg-muted/30 aspect-[3/4] flex items-center justify-center shadow-sm">
                  {isPdf(img) ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <FileText size={48} className="text-primary mb-2" />
                      <span className="text-xs font-bold uppercase tracking-tight">PDF Document</span>
                    </div>
                  ) : (
                    <img src={img} alt={`Capture ${idx}`} className="max-w-full max-h-full object-contain" />
                  )}
                  <Button variant="destructive" size="icon" onClick={() => removeCapturedImage(idx)} className="absolute top-3 right-3 size-9 rounded-full shadow-lg">
                    <X size={18} />
                  </Button>
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-[10px] text-white font-bold uppercase">
                    Attachment #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t shrink-0 flex gap-3 flex-col sm:flex-row bg-background">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="flex-1 h-12 text-sm font-bold">
              Capture More
            </Button>
            <Button onClick={() => handleProcessReport({ photoDataUris: capturedImages })} disabled={isLoading} className="flex-1 h-12 text-sm font-bold shadow-lg">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              Analyze {capturedImages.length} {capturedImages.length === 1 ? 'Attachment' : 'Attachments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
          <DialogHeader className="p-6 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-headline">Health Record Insights</DialogTitle>
                <DialogDescription>Analyzed on {selectedReport?.dateLabel}</DialogDescription>
              </div>
              {selectedReport?.summary && (
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedReport.summary)} className="font-bold">
                  <Copy className="size-4 mr-2" /> Copy
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 touch-pan-y">
            <div className="p-6 space-y-10">
              {selectedReport && (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                       <Zap className="size-6" />
                       <h3 className="text-sm font-black uppercase tracking-widest">AI Clinical Assessment</h3>
                    </div>
                    <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap shadow-inner text-foreground">
                      {selectedReport.summary}
                    </div>
                  </section>
                  
                  {selectedReport.fileDataUri ? (
                    <section className="space-y-4">
                       <div className="flex items-center gap-2 text-muted-foreground">
                          {isPdf(selectedReport.fileDataUri) ? <FileText className="size-6" /> : <ImageIcon className="size-6" />}
                          <h3 className="text-sm font-black uppercase tracking-widest">{isPdf(selectedReport.fileDataUri) ? 'PDF Document' : 'Document Scan'}</h3>
                       </div>
                       <div className="border-2 rounded-2xl overflow-hidden bg-muted/50">
                          {isPdf(selectedReport.fileDataUri) ? (
                            <iframe src={selectedReport.fileDataUri} className="w-full h-[600px] border-none" title="PDF Preview" />
                          ) : (
                            <img src={selectedReport.fileDataUri} className="max-h-[500px] w-full object-contain mx-auto" alt="Report scan" />
                          )}
                       </div>
                    </section>
                  ) : selectedReport.type !== 'manual' && (
                    <section className="space-y-4">
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="size-6" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Reference Unavailable</h3>
                       </div>
                       <div className="bg-muted/10 border-2 border-dashed rounded-2xl p-8 text-center text-sm text-muted-foreground">
                         The original attachment was too large to store for history playback.
                       </div>
                    </section>
                  )}

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <FileText className="size-6" />
                       <h3 className="text-sm font-black uppercase tracking-widest">Source Material</h3>
                    </div>
                    <div className="bg-muted/20 border-2 rounded-2xl p-6 text-xs font-mono whitespace-pre-wrap text-muted-foreground/80 leading-loose">
                      {selectedReport.originalText}
                    </div>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t flex flex-row justify-between gap-4 bg-muted/5 shrink-0">
            <Button variant="ghost" className="text-destructive font-bold hover:bg-destructive/10 px-4" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="size-4 mr-2" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="px-8 font-bold">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This record will be removed from your history forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="font-bold">Keep Record</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-white hover:bg-destructive/90 font-bold">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
