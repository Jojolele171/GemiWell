'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCategory } from '@/lib/data';

export default function SettingsPage() {
  const { user, loading: isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Health Profile State
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [habits, setHabits] = useState('');
  const [diet, setDiet] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  // Category State
  const [category, setCategory] = useState<UserCategory>('normal');

  useEffect(() => {
    if (user && db) {
      setName(user.displayName || '');
      setEmail(user.email || '');

      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAge(data.age || '');
            setConditions(data.conditions || '');
            setHabits(data.habits || '');
            setDiet(data.diet || '');
            setHeight(data.height || '');
            setWeight(data.weight || '');
            setCategory(data.userCategory || 'normal');
          }
          setIsOffline(false);
        } catch (error: any) {
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            setIsOffline(true);
          }
        }
      };
      fetchProfile();
    }
  }, [user, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSaving(true);
    const auth = getAuth();

    try {
      if(auth.currentUser){
        await updateProfile(auth.currentUser, { displayName: name });
      }

      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        uid: user.uid,
        email: user.email,
        displayName: name,
        age,
        conditions,
        habits,
        diet,
        height,
        weight,
        userCategory: category,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: 'Settings Saved',
        description: 'Your profile has been updated.',
      });
      
      setIsOffline(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isUserLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-10 w-1/3" />
              <Card><CardHeader><Skeleton className="h-20 w-full" /></CardHeader></Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and health profile context for AI advice.
        </p>
      </div>

      {isOffline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            The database is currently unreachable. Changes will sync when you are back online.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Profile</CardTitle>
            <CardDescription>Update your personal account information and category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">User Category</Label>
              <Select value={category} onValueChange={(val: UserCategory) => setCategory(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Profile</CardTitle>
            <CardDescription>Information stored here is used by the AI to provide personalized coaching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. 180"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. 75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Underlying Conditions</Label>
              <Textarea
                id="conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={isSaving}
                placeholder="List any medical conditions, allergies, or chronic issues..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diet">General Diet</Label>
              <Textarea
                id="diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                disabled={isSaving}
                placeholder="Describe your typical daily meals, restrictions, or preferences..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habits">Daily Habits</Label>
              <Textarea
                id="habits"
                value={habits}
                onChange={(e) => setHabits(e.target.value)}
                disabled={isSaving}
                placeholder="E.g. Smoking status, alcohol consumption, exercise frequency, sleep patterns..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !db} size="lg">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
