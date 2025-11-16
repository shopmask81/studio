
'use client';

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderItem } from "@/lib/types";

interface OrderItemsCardProps {
    items: OrderItem[];
    total: number;
}

export function OrderItemsCard({ items, total }: OrderItemsCardProps) {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = total - subtotal;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden sm:table-cell">Image</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.productId}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={item.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={item.imageUrl || 'https://placehold.co/64x64'}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex-col items-end space-y-2 pt-4 border-t">
                <div className="flex justify-between w-full max-w-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${shipping >= 0 ? shipping.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg w-full max-w-xs pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
