'use client';

import { useState } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AffiliateTool() {
    const { user } = useUser();
    const [productUrl, setProductUrl] = useState('');
    const [affiliateLink, setAffiliateLink] = useState('');
    const { toast } = useToast();

    const generateLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productUrl || !user) return;
        
        try {
            const url = new URL(productUrl);
            const generated = `${url.origin}${url.pathname}?ref=${user.uid}`;
            setAffiliateLink(generated);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Invalid URL',
                description: 'Please enter a valid product URL.',
            });
        }
    };

    const copyToClipboard = () => {
        if (!affiliateLink) return;
        navigator.clipboard.writeText(affiliateLink);
        toast({
            title: 'Copied to clipboard!',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Link Generator</CardTitle>
                <CardDescription>Paste a product URL from our shop to create your affiliate link.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={generateLink} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-url">Product URL</Label>
                        <Input 
                            id="product-url"
                            placeholder="https://maskshopv2.com/products/..."
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
                    </div>
                )}
            </CardContent>
        </Card>
    );
}