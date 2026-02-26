'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, FileText, HeartPulse, User, ShieldCheck } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { UserCategory } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const features = [
  {
    title: 'AI Health Chat',
    description: 'Get personalized health advice from our AI assistant.',
    href: '/dashboard/chat',
    icon: <Bot className="size-8 text-primary" />,
  },
  {
    title: 'Medical Reports',
    description: 'Summarize and analyze your medical reports with AI.',
    href: '/dashboard/reports',
    icon: <FileText className="size-8 text-primary" />,
  },
  {
    title: 'Health Tracking',
    description: 'Log your diet, habits, and see your progress.',
    href: '/dashboard/tracking',
    icon: <HeartPulse className="size-8 text-primary" />,
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [category, setCategory] = useState<UserCategory>('normal');

  useEffect(() => {
    if (user && db) {
      const fetchCategory = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCategory(docSnap.data().userCategory || 'normal');
        }
      };
      fetchCategory();
    }
  }, [user, db]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, {user?.displayName || 'User'}</h1>
          <p className="text-muted-foreground">Your personal AI health assistant dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "px-3 py-1 text-sm font-semibold uppercase flex items-center gap-2",
            category === 'doctor' ? "border-primary text-primary bg-primary/5" : category === 'patient' ? "border-accent text-accent bg-accent/5" : "border-muted text-muted-foreground"
          )}>
            {category === 'doctor' ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
            {category} Account
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                {feature.icon}
                <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
               <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={feature.href}>
                  Go to {feature.title}
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
