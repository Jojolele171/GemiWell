'use client';

import { useState } from 'react';
import { Bot, User, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getHealthAdviceFromAIChat } from '@/ai/flows/get-health-advice-from-ai-chat';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, limit } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function AIChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const profileRef = useMemoFirebase(() => (user && db ? doc(db, 'users', user.uid) : null), [user, db]);
  const { data: healthProfile, loading: profileLoading } = useDoc(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [user, db]);

  const { data: messages = [], loading: chatLoading } = useCollection(messagesQuery);

  const reportsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [user, db]);

  const { data: reports = [] } = useCollection(reportsQuery);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiLoading || !user || !db) return;

    const userQuery = input.trim();
    setInput('');
    setIsAiLoading(true);

    const messagesRef = collection(db, 'users', user.uid, 'messages');

    try {
      const sanitizedProfile = healthProfile ? {
        conditions: healthProfile.conditions || '',
        habits: healthProfile.habits || '',
        diet: healthProfile.diet || '',
        height: healthProfile.height || '',
        weight: healthProfile.weight || '',
        age: healthProfile.age || '',
      } : undefined;

      const sanitizedReports = reports?.map((r: any) => ({
        summary: r.summary || '',
        dateLabel: r.dateLabel || '',
        structuredData: r.structuredData || {},
      })) || [];

      const result = await getHealthAdviceFromAIChat({
        query: userQuery,
        healthProfile: sanitizedProfile,
        recentReports: sanitizedReports,
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Action Blocked',
          description: result.error,
        });
        setIsAiLoading(false);
        return;
      }

      addDoc(messagesRef, {
        role: 'user',
        content: userQuery,
        createdAt: serverTimestamp(),
      });

      addDoc(messagesRef, {
        role: 'assistant',
        content: result.advice,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const isInitialLoading = profileLoading || chatLoading;

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader>
        <Bot className="h-8 w-8 text-primary mb-2" />
        <CardTitle className="font-headline text-2xl text-primary">AI Health Chat</CardTitle>
        <CardDescription>
          {healthProfile
            ? 'Personalized coaching active (using your profile and recent reports).'
            : 'Generic coaching active. Complete your profile for better results.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {!healthProfile && !isInitialLoading && (
          <Alert className="mb-2 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Profile Incomplete</AlertTitle>
            <AlertDescription>
              <Link href="/dashboard/settings" className="font-semibold underline">
                Fill out your Health Profile
              </Link>{' '}
              to get AI advice tailored to your needs.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages && messages.length === 0 && !isInitialLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    Hey! I&apos;m GemiCare, your AI health coach. How can I help you feel your best today?
                  </p>
                </div>
              </div>
            )}

            {messages && messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isAiLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-lg bg-muted p-3">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask GemiCare anything..."
            disabled={isAiLoading || isInitialLoading}
          />
          <Button type="submit" disabled={isAiLoading || !input.trim() || isInitialLoading}>
            {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
