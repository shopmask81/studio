
'use client';

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItemsCardProps {
    items: OrderItem[];
    total: number;
    productImages: Record<string, string | null | undefined>;
}

export function OrderItemsCard({ items, total, productImages }: OrderItemsCardProps) {
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
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const imageUrl = productImages[item.productId];
                            const isImageLoading = !productImages.hasOwnProperty(item.productId);
                            
                            return (
                                <TableRow key={item.productId}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                             {isImageLoading ? (
                                                <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
                                            ) : (
                                                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                                    <Image
                                                        alt={item.name}
                                                        className="object-cover"
                                                        fill
                                                        src={imageUrl || 'https://placehold.co/64x64'}
                                                        sizes="64px"
                                                    />
                                                </div>
                                            )}
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            )
                        })}
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
