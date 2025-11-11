'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Loader2, Lock, PlusCircle } from 'lucide-react';
import { OrderSummary } from './order-summary';
import { useCart } from '../cart/cart-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Address } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../language/language-provider';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  street: z.string().min(3, 'Street address is required.'),
  city: z.string().min(2, 'City is required.'),
  postalCode: z.string().min(4, 'Postal code is required.'),
  country: z.string().min(2, 'Country is required.'),
  paymentMethod: z.enum(['card', 'paypal', 'cod'], {
    required_error: 'You need to select a payment method.',
  }),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'card') {
        if (!data.cardNumber || !/^\d{16}$/.test(data.cardNumber)) {
            ctx.addIssue({ code: 'custom', message: 'Valid card number is required.', path: ['cardNumber'] });
        }
        if (!data.expiryDate || !/^\d{2}\/\d{2}$/.test(data.expiryDate)) {
            ctx.addIssue({ code: 'custom', message: 'MM/YY format required.', path: ['expiryDate'] });
        }
        if (!data.cvv || !/^\d{3,4}$/.test(data.cvv)) {
            ctx.addIssue({ code: 'custom', message: 'Valid CVV is required.', path: ['cvv'] });
        }
    }
});

export function CheckoutForm() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { t } = useTranslation();
    
    const addressesRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/addresses`);
    }, [user, firestore]);

    const { data: addresses, isLoading: areAddressesLoading } = useCollection<Address>(addressesRef);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: user?.displayName ?? '',
            email: user?.email ?? '',
            phone: '',
            street: '',
            city: '',
            postalCode: '',
            country: '',
            paymentMethod: 'card',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        },
    });

    useEffect(() => {
        if (user && !form.getValues().email) {
            form.setValue('email', user.email || '');
        }
        if (user && !form.getValues().fullName) {
            form.setValue('fullName', user.displayName || '');
        }
    }, [user, form]);
    
    useEffect(() => {
        if (addresses) {
            const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
            if (defaultAddress) {
                form.reset({
                    ...form.getValues(),
                    fullName: defaultAddress.fullName,
                    phone: defaultAddress.phone,
                    street: defaultAddress.street,
                    city: defaultAddress.city,
                    postalCode: defaultAddress.zipCode,
                    country: defaultAddress.country,
                });
                setSelectedAddressId(defaultAddress.id);
            }
        }
    }, [addresses, form]);

    const handleAddressChange = (addressId: string) => {
        const selected = addresses?.find(a => a.id === addressId);
        if (selected) {
            form.setValue('fullName', selected.fullName);
            form.setValue('phone', selected.phone);
            form.setValue('street', selected.street);
            form.setValue('city', selected.city);
            form.setValue('postalCode', selected.zipCode);
            form.setValue('country', selected.country);
            setSelectedAddressId(addressId);
        }
    }

    const paymentMethod = form.watch('paymentMethod');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) return;

        try {
            await addDoc(collection(firestore, 'orders'), {
                userId: user?.uid ?? null,
                customer: {
                    fullName: values.fullName,
                    email: values.email,
                    phone: values.phone,
                    address: {
                        street: values.street,
                        city: values.city,
                        postalCode: values.postalCode,
                        country: values.country,
                    }
                },
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.discountPrice ?? item.product.price,
                })),
                totalAmount: cartTotal,
                paymentMethod: values.paymentMethod,
                status: 'pending',
                orderDate: serverTimestamp(),
            });

            toast({
                title: 'Order Placed!',
                description: 'Thank you for your purchase.',
            });

            clearCart();
            router.push('/order-confirmation');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: error.message || 'There was an issue placing your order.',
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('customer_information')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>{t('full_name')}</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>{t('email_address')}</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel>{t('phone_number')}</FormLabel><FormControl><Input placeholder="+1 (555) 555-5555" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('shipping_address')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {user && !areAddressesLoading && addresses && addresses.length > 0 && (
                                <FormItem>
                                    <FormLabel>{t('select_address')}</FormLabel>
                                    <Select onValueChange={handleAddressChange} value={selectedAddressId}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_address')} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {addresses.map(addr => (
                                                <SelectItem key={addr.id} value={addr.id}>
                                                    {addr.street}, {addr.city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <FormDescription>
                                        <Link href="/account/addresses" className="text-sm text-primary hover:underline flex items-center gap-1">
                                            <PlusCircle className="h-4 w-4" /> {t('manage_saved_addresses')}
                                        </Link>
                                    </FormDescription>
                                </FormItem>
                            )}

                            <FormField control={form.control} name="street" render={({ field }) => (
                                <FormItem><FormLabel>{t('street_address')}</FormLabel><FormControl><Input placeholder="123 Mask Lane" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid sm:grid-cols-3 gap-4">
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem><FormLabel>{t('city')}</FormLabel><FormControl><Input placeholder="Venice" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="postalCode" render={({ field }) => (
                                    <FormItem><FormLabel>{t('postal_code')}</FormLabel><FormControl><Input placeholder="90210" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="country" render={({ field }) => (
                                    <FormItem><FormLabel>{t('country')}</FormLabel><FormControl><Input placeholder="USA" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle>{t('payment')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors data-[state=checked]:border-primary">
                                            <FormControl><RadioGroupItem value="card" /></FormControl>
                                            <FormLabel className="font-normal flex-grow">{t('credit_debit_card')}</FormLabel>
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 data-[state=checked]:border-primary">
                                            <FormControl><RadioGroupItem value="paypal" /></FormControl>
                                            <FormLabel className="font-normal flex-grow">{t('paypal')}</FormLabel>
                                            <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 text-muted-foreground fill-current"><path d="M7.483 5.343c.271-1.556 1.55-2.736 3.018-2.736h5.22c3.214 0 4.735 2.015 4.194 5.093-.33 1.884-1.485 2.935-2.924 2.935h-2.936c-.846 0-1.513.25-1.748.91-.252.697.16 1.253.903 1.253h.646c.396 0 .713.21.84.552l.216.924c.126.54.51 1.038.996 1.038h.493c1.233 0 2.228.937 2.228 2.126 0 1.254-1.07 2.26-2.39 2.26h-4.32c-3.15 0-4.665-1.99-4.13-5.013.31-1.77 1.48-2.858 2.87-2.858h2.93c.84 0 1.524-.26 1.76-.93.252-.71-.16-1.284-.91-1.284h-.54c-.42 0-.75-.22-.88-.58l-.21-.92c-.12-.53-.51-1.01-1.002-1.01H9.42c-1.26 0-2.22-.93-2.22-2.12 0-1.14.83-2.07 1.95-2.14.12-.01.21-.01.29-.01z"/></svg>
                                        </FormItem>
                                         <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 data-[state=checked]:border-primary">
                                            <FormControl><RadioGroupItem value="cod" /></FormControl>
                                            <FormLabel className="font-normal flex-grow">{t('cash_on_delivery')}</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {paymentMethod === 'card' && (
                                <div className="space-y-4 pt-4 border-t mt-4">
                                     <FormField control={form.control} name="cardNumber" render={({ field }) => (
                                        <FormItem><FormLabel>{t('card_number')}</FormLabel><FormControl><Input placeholder="1111 2222 3333 4444" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                            <FormItem><FormLabel>{t('expiry_date')}</FormLabel><FormControl><Input placeholder="MM/YY" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="cvv" render={({ field }) => (
                                            <FormItem><FormLabel>CVV</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="md:col-span-1">
                    <OrderSummary />
                    <Button type="submit" size="lg" className="w-full mt-6" disabled={form.formState.isSubmitting || cartItems.length === 0}>
                        {form.formState.isSubmitting ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Lock className="me-2 h-4 w-4" />
                        )}
                        {t('place_order')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
