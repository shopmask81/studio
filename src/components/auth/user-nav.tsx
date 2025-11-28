
'use client';

import Link from 'next/link';
import { LogOut, User, Link as LinkIcon, MapPin, LayoutDashboard } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from './auth-provider';
import { getAuthInstance } from '@/firebase/client';
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
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from '../language/language-provider';

export function UserNav() {
  const { user, userProfile, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    const auth = getAuthInstance();
    try {
      await signOut(auth);
      // Redirect immediately. The AuthProvider will handle the state change.
      router.push('/');
      toast({
        title: t('signed_out_title').text,
        description: t('signed_out_desc').text,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('sign_out_error_title').text,
        description: t('sign_out_error_desc').text,
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!user) {
    return (
        <Button 
            asChild 
            variant="ghost" 
            size="icon" 
            className="group transition-all duration-300 ease-in-out"
            aria-label={t('login').text}
        >
            <Link href="/login">
                <User className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors duration-300" />
                <span className="sr-only">{t('login').text}</span>
            </Link>
        </Button>
    );
  }

  const isAffiliate = userProfile?.role === 'affiliate';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>
              {user.email ? user.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName ?? 'Anonymous'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="mr-2 h-4 w-4" />
                <span>{t('account').text}</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href="/account/addresses">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{t('my_addresses').text}</span>
              </Link>
            </DropdownMenuItem>
            {isAffiliate && (
              <DropdownMenuItem asChild>
                <Link href="/affiliate">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  <span>{t('affiliate').text}</span>
                </Link>
              </DropdownMenuItem>
            )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('log_out').text}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
