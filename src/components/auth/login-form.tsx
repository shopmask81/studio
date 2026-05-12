'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getAuthInstance, getFirestoreInstance } from '@/firebase/client';
import { useTranslation } from '../language/language-provider';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuthInstance();
    const firestore = getFirestoreInstance();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After successful login, check the user's role from Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        
        // Redirect based on role
        if (userProfile.role === 'admin') {
          toast({
            title: t('login_successful_title').text,
            description: "Welcome Admin! Redirecting to dashboard...",
          });
          router.push('/admin/dashboard');
        } else {
          toast({
            title: t('login_successful_title').text,
            description: t('login_successful_desc').text,
          });
          router.push('/account');
        }
      } else {
        // Fallback if user document doesn't exist for some reason
        toast({
          title: t('login_successful_title').text,
          description: t('login_successful_desc').text,
        });
        router.push('/account');
      }

    } catch (error: any) {
      let errorMessage = t('login_error_default').text;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('login_error_invalid_credentials').text;
      }
       else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
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
            <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('sign_in').text}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
