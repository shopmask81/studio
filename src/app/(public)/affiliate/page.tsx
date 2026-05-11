
'use client';

import { useAuth } from "@/components/auth/auth-provider";
import { AffiliateTool } from "@/components/affiliate/affiliate-tool";
import { AffiliateOrders } from "./components/affiliate-orders";
import { AffiliateStats } from "./components/affiliate-stats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2, Link as LinkIcon, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useTranslation } from "@/components/language/language-provider";

export default function AffiliatePage() {
    const { user, userProfile, isLoading } = useAuth();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-24 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const isAffiliate = userProfile?.role === 'affiliate' || userProfile?.role === 'admin';

    if (!isAffiliate) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HandCoins className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl font-headline font-bold mb-4">Join Our Affiliate Program</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Partner with MaskShop and earn commissions on every successful referral. 
                    Share your love for handmade crafts and get rewarded.
                </p>
                <Card className="text-left mb-8 border-dashed border-2">
                    <CardHeader>
                        <CardTitle>How it works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <div className="font-bold text-primary text-xl">1.</div>
                            <p>Contact our support team to request an affiliate account.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="font-bold text-primary text-xl">2.</div>
                            <p>Once approved, you'll get a unique dashboard with tracking links.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="font-bold text-primary text-xl">3.</div>
                            <p>Share links to products or the shop on your social media or blog.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="font-bold text-primary text-xl">4.</div>
                            <p>Earn a fixed percentage commission for every order placed through your link!</p>
                        </div>
                    </CardContent>
                </Card>
                <Button asChild size="lg">
                    <Link href="/contact">Contact Support to Join</Link>
                </Button>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-headline font-bold">Affiliate Dashboard</h1>
                        <p className="text-muted-foreground">Manage your referrals and track your earnings.</p>
                    </div>
                </div>

                <AffiliateStats />

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <AffiliateTool />
                    </div>
                    <div className="lg:col-span-2">
                        <AffiliateOrders />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
