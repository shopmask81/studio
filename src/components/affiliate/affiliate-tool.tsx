
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Link as LinkIcon, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "../language/language-provider";
import { useAuth } from "../auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export function AffiliateTool() {
    const { user, userProfile } = useAuth();
    const firestore = useFirestore();
    const [productUrl, setProductUrl] = useState('');
    const [affiliateLink, setAffiliateLink] = useState('');
    const [isResolvingId, setIsResolvingId] = useState(false);
    const [resolvedId, setResolvedId] = useState<string | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    // Effect to try and resolve affiliate ID if missing from profile (for existing users)
    useEffect(() => {
        const resolveAffiliateId = async () => {
            if (!user || userProfile?.affiliateId || !firestore) return;
            
            setIsResolvingId(true);
            try {
                const affRef = collection(firestore, 'affiliates');
                const q = query(affRef, where('userId', '==', user.uid), limit(1));
                const snap = await getDocs(q);
                
                if (!snap.empty) {
                    setResolvedId(snap.docs[0].id);
                }
            } catch (error) {
                console.error("Failed to resolve affiliate ID:", error);
            } finally {
                setIsResolvingId(false);
            }
        };

        resolveAffiliateId();
    }, [user, userProfile, firestore]);

    const generateLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productUrl || !user || !userProfile) return;
        
        try {
            const url = new URL(productUrl);
            const code = userProfile.affiliateCode || user.uid.slice(0, 8);
            const aid = userProfile.affiliateId || resolvedId;
            
            if (!aid) {
                toast({
                    variant: 'destructive',
                    title: 'Missing Affiliate ID',
                    description: 'Your account is still being updated. Please try again in a few moments or contact support.',
                });
                return;
            }

            // Standardized format: ?ref=CODE&aid=DOC_ID
            const generated = `${url.origin}${url.pathname}?ref=${code}&aid=${aid}`;
            setAffiliateLink(generated);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: t('invalid_url_title').text,
                description: t('invalid_url_desc').text,
            });
        }
    };

    const copyToClipboard = () => {
        if (!affiliateLink) return;
        navigator.clipboard.writeText(affiliateLink);
        toast({
            title: t('copied_to_clipboard').text,
        });
    };

    const currentAffiliateId = userProfile?.affiliateId || resolvedId;

    if (isResolvingId) {
        return (
            <div className="flex items-center justify-center p-8 border rounded-lg animate-pulse">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <p className="text-sm text-muted-foreground">Initializing tools...</p>
            </div>
        );
    }

    if (!currentAffiliateId && userProfile?.role !== 'admin') {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    We couldn't locate your tracking ID. Please click "Refresh" or contact support to activate your tools.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Link Generator</CardTitle>
                <CardDescription>Paste a product URL from our shop to create your unique tracking link.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={generateLink} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-url">Product URL</Label>
                        <Input 
                            id="product-url"
                            placeholder="https://MaskShop.com/products/..."
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Generate Link
                    </Button>
                </form>
                {affiliateLink && (
                    <div className="mt-6 space-y-2">
                        <Label>Your Affiliate Link</Label>
                        <div className="flex items-center gap-2">
                            <Input value={affiliateLink} readOnly />
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            This link includes your referral code and secure affiliate ID.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
