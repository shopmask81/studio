
'use client';

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, DollarSign, Percent } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import { useState, useEffect } from "react";
import type { Affiliate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function AffiliateStats() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { formatPrice } = useCurrency();
    const [affiliateData, setAffiliateData] = useState<Affiliate | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAffiliate() {
            if (!user || !firestore) return;
            try {
                const affQuery = query(collection(firestore, 'affiliates'), where('userId', '==', user.uid));
                const snap = await getDocs(affQuery);
                if (!snap.empty) {
                    setAffiliateData({ id: snap.docs[0].id, ...snap.docs[0].data() } as Affiliate);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAffiliate();
    }, [user, firestore]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    const stats = [
        {
            title: "Total Earnings",
            value: formatPrice(affiliateData?.totalEarnings || 0),
            description: "Accumulated commissions",
            icon: DollarSign,
            color: "text-green-600 bg-green-100 dark:bg-green-900/20"
        },
        {
            title: "Total Orders",
            value: affiliateData?.totalOrders || 0,
            description: "Successful referrals",
            icon: ShoppingCart,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
        },
        {
            title: "Commission Rate",
            value: `${((affiliateData?.commissionRate || 0) * 100).toFixed(0)}%`,
            description: "Current payout rate",
            icon: Percent,
            color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20"
        },
        {
            title: "Conversion",
            value: "---",
            description: "Clicks vs Orders",
            icon: TrendingUp,
            color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <Card key={i} className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-full ${stat.color}`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
