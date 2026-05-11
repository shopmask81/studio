
'use client';

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function AffiliateOrders() {
    const { userProfile } = useAuth();
    const firestore = useFirestore();
    const { formatPrice } = useCurrency();

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile?.affiliateCode) return null;
        return query(
            collection(firestore, 'orders'),
            where('affiliateCode', '==', userProfile.affiliateCode),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, userProfile?.affiliateCode]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Referred Orders</CardTitle>
                <CardDescription>Real-time list of orders placed using your referral code.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No referrals yet. Start sharing your link!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Your Commission</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs truncate max-w-[100px]">
                                            {order.id}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {order.createdAt ? format(order.createdAt.toDate(), 'PP') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(order.total)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {formatPrice(order.commissionAmount || 0)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="capitalize text-[10px]">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
