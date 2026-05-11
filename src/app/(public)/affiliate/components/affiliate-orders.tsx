
'use client';

import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function AffiliateOrders() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { formatPrice } = useCurrency();

    const cacheDocRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'cachedData', `affiliate_orders_${user.uid}`);
    }, [firestore, user]);

    const { data: cacheData, isLoading, error } = useDoc<{ orders: Order[] }>(cacheDocRef);

    const orders = cacheData?.orders || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Referred Orders</CardTitle>
                <CardDescription>Orders placed using your referral link (cached data).</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-md">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">Failed to load cached orders.</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-md">
                        No referrals found in cache. Start sharing your link!
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
                                {orders.map((order) => {
                                    const orderDate = typeof order.createdAt === 'string' 
                                        ? parseISO(order.createdAt) 
                                        : (order.createdAt as any)?.toDate 
                                            ? (order.createdAt as any).toDate() 
                                            : new Date();

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs truncate max-w-[100px]">
                                                {order.id}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(orderDate, 'PP')}
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
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
