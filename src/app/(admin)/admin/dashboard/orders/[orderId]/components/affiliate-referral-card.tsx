'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandCoins, Info } from "lucide-react";
import type { Order } from "@/lib/types";
import { useCurrency } from "@/components/currency/currency-provider";

interface AffiliateReferralCardProps {
    order: Order;
}

export function AffiliateReferralCard({ order }: AffiliateReferralCardProps) {
    const { formatPrice } = useCurrency();

    if (!order.affiliateCode) {
        return (
            <Card className="border-dashed">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Order Source
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">This is a regular customer order with no affiliate referral.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-primary" />
                    Affiliate Referral
                </CardTitle>
                <CardDescription>This order was referred by a partner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tracking Code</span>
                    <Badge variant="outline" className="font-bold border-primary/30 text-primary">
                        {order.affiliateCode}
                    </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Commission Amount</span>
                    <span className="font-bold text-primary">
                        {formatPrice(order.commissionAmount || 0)}
                    </span>
                </div>
                <div className="pt-2 text-[10px] text-muted-foreground font-mono truncate">
                    ID: {order.affiliateId}
                </div>
            </CardContent>
        </Card>
    );
}
