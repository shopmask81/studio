
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useTranslation } from '../language/language-provider';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          variant: 'destructive',
          title: t('email_not_verified_title').text,
          description: t('email_not_verified_desc').text,
        });
        setIsLoading(false);
        return;
      }
      
      // Check for admin role
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        if (userProfile.role === 'admin') {
          toast({
            title: t('login_successful_title').text,
            description: "Welcome Admin! Redirecting to dashboard...",
          });
          router.push('/admin/dashboard');
          return;
        }
      }

      toast({
        title: t('login_successful_title').text,
        description: t('login_successful_desc').text,
      });
      router.push('/account');
    } catch (error: any) {
      let errorMessage = t('login_error_default').text;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = t('login_error_invalid_credentials').text;
      }
      toast({
        variant: 'destructive',
        title: t('login_failed_title').text,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline" {...t('login')}>{t('login').text}</CardTitle>
        <CardDescription {...t('login_desc')}>{t('login_desc').text}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignIn}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" {...t('email_address')}>{t('email_address').text}</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" {...t('password')}>{t('password').text}</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('sign_in').text}
          </Button>
          <div className="mt-4 text-center text-sm">
            {t('dont_have_account').text}{' '}
            <Link href="/signup" className="underline text-primary hover:text-accent">
              {t('sign_up').text}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
