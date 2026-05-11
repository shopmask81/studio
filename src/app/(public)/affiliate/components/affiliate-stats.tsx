
'use client';

import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, DollarSign, Percent, AlertCircle, PackageCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AffiliateStats() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { formatPrice } = useCurrency();

    const cacheDocRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'cachedData', `affiliate_stats_${user.uid}`);
    }, [firestore, user]);

    const { data: statsData, isLoading, error } = useDoc<{ 
        totalEarnings: number; 
        totalOrders: number; 
        deliveredOrders: number;
        commissionRate: number; 
        status: string;
    }>(cacheDocRef);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Failed to load statistics from cache.</p>
            </div>
        )
    }

    const stats = [
        {
            title: "Total Earnings",
            value: formatPrice(statsData?.totalEarnings || 0),
            description: "Accumulated commissions",
            icon: DollarSign,
            color: "text-green-600 bg-green-100 dark:bg-green-900/20"
        },
        {
            title: "Total Orders",
            value: statsData?.totalOrders || 0,
            description: "All referred orders",
            icon: ShoppingCart,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
        },
        {
            title: "Delivered Orders",
            value: statsData?.deliveredOrders || 0,
            description: "Successfully completed",
            icon: PackageCheck,
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20"
        },
        {
            title: "Commission Rate",
            value: `${((statsData?.commissionRate || 0) * 100).toFixed(0)}%`,
            description: "Current payout rate",
            icon: Percent,
            color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20"
        },
        {
            title: "Account Status",
            value: statsData?.status || "active",
            description: "Current partner status",
            icon: TrendingUp,
            color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
                <Card key={i} className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-full ${stat.color}`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
