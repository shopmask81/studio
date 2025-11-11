'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useTranslation } from '../language/language-provider';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: fullName });

      // Send verification email
      await sendEmailVerification(user);

      // Create user document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name: fullName,
        email: user.email,
        role: "customer",
        affiliateCode: user.uid.slice(0, 8), // simple unique code
        referredBy: null,
        createdAt: serverTimestamp(),
        emailVerified: false,
      });

      toast({
        title: t('signup_verification_sent_title').text,
        description: t('signup_verification_sent_desc').text,
      });
      router.push('/login');
    } catch (error: any) {
      let description = t('signup_error_default').text;
      if (error.code === 'auth/email-already-in-use') {
        description = t('signup_error_email_in_use').text;
      }
      toast({
        variant: 'destructive',
        title: t('signup_failed_title').text,
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline" {...t('sign_up')}>{t('sign_up').text}</CardTitle>
        <CardDescription {...t('signup_desc')}>{t('signup_desc').text}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name" {...t('full_name')}>{t('full_name').text}</Label>
            <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" {...t('email_address')}>{t('email_address').text}</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" {...t('password')}>{t('password').text}</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('create_account').text}
          </Button>
          <div className="mt-4 text-center text-sm" {...t('already_have_account')}>
            {t('already_have_account').text}{' '}
            <Link href="/login" className="underline text-primary hover:text-accent">
              {t('login').text}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
