
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../language/language-provider";

export function AccountDetails() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { t } = useTranslation();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.name || '');
        } else if (user) {
            setFullName(user.displayName || '');
        }
    }, [userProfile, user]);


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userDocRef) return;
        setIsLoading(true);
        try {
            // Update auth profile
            await updateProfile(user, { displayName: fullName });

            // Update firestore document
            await setDoc(userDocRef, { name: fullName }, { merge: true });
            
            toast({
                title: t('profile_updated_title').text,
                description: t('profile_updated_desc').text,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('update_failed_title').text,
                description: error.message || t('update_failed_desc').text,
            });
        } finally {
            setIsLoading(false);
        }
    }

    const loading = isUserLoading || isProfileLoading;

    if (loading) {
        return (
             <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8" {...t('your_account')}>{t('your_account').text}</h1>
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle {...t('profile_details')}>{t('profile_details').text}</CardTitle>
                        <CardDescription {...t('manage_your_account_info')}>{t('manage_your_account_info').text}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="email" {...t('email_address')}>{t('email_address').text}</Label>
                             <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="fullName" {...t('full_name')}>{t('full_name').text}</Label>
                             <Input id="fullName" disabled />
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('loading').text}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-headline mb-8" {...t('your_account')}>{t('your_account').text}</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle {...t('profile_details')}>{t('profile_details').text}</CardTitle>
                    <CardDescription {...t('manage_your_account_info')}>{t('manage_your_account_info').text}</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" {...t('email_address')}>{t('email_address').text}</Label>
                            <Input id="email" type="email" value={user.email || ''} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="fullName" {...t('full_name')}>{t('full_name').text}</Label>
                            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save_changes').text}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
