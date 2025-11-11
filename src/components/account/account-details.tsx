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

export function AccountDetails() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

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
                title: 'Profile Updated',
                description: 'Your details have been successfully updated.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'An error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    const loading = isUserLoading || isProfileLoading;

    if (loading) {
        return (
             <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8">Your Account</h1>
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                        <CardDescription>Manage your account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="email">Email</Label>
                             <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="fullName">Full Name</Label>
                             <Input id="fullName" disabled />
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-headline mb-8">Your Account</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>Manage your account information.</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user.email || ''} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
