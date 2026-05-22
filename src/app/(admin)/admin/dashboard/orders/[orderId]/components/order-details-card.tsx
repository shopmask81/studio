
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";
import { format } from "date-fns";
import { Mail, Phone, Home, Calendar } from "lucide-react";
import { useTranslation } from "@/components/language/language-provider";

interface OrderDetailsCardProps {
    order: Order;
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
    const { t } = useTranslation();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>
                    Contact and shipping information for this order.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {order.createdAt ? format(order.createdAt.toDate(), 'PPP, p') : 'N/A'}
                    </span>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                    <p className="font-medium">{order.name}</p>
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${order.email}`} className="text-primary hover:underline">{order.email}</a>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{order.phone}</span>
                    </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                    <Home className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="text-muted-foreground">
                        <p>{order.street}</p>
                        <p>{order.city}{order.emirate ? `, ${t(order.emirate as any).text}` : ''}</p>
                        <p>{order.zip}</p>
                        <p>{order.country}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
