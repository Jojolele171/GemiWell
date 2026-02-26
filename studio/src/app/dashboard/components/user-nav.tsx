'use client';

import { useRouter } from 'next/navigation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, LogOut, User, ShieldCheck } from 'lucide-react';
import { useUser, signOutUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { UserCategory } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const getInitials = (name: string | null | undefined) => {
  if (!name) return '';
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

export function UserNav() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');
  const { setTheme } = useTheme();
  const router = useRouter();
  const { user, loading } = useUser();
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

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  // Define colors based on category
  const categoryColors = {
    doctor: 'ring-primary border-primary bg-primary/10',
    patient: 'ring-accent border-accent bg-accent/10',
    normal: 'ring-muted border-muted bg-muted/10',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 flex items-center justify-center">
          <div className={cn(
            "rounded-full p-[2px] ring-2 transition-all",
            categoryColors[category]
          )}>
            <Avatar className="h-9 w-9">
              {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt="User Avatar" />
              ) : (
                  userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />
              )}
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
          </div>
          {category === 'doctor' && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              <ShieldCheck className="h-3 w-3 text-primary fill-primary/10" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{user?.displayName || 'GemiWell User'}</p>
              <Badge variant="outline" className={cn(
                "text-[10px] px-1 py-0 uppercase h-4",
                category === 'doctor' ? "text-primary border-primary" : category === 'patient' ? "text-accent border-accent" : ""
              )}>
                {category}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'user@gemiwell.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <User className="mr-2" />
            <span>Profile & Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
