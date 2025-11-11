'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Address } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  phone: z.string().optional(),
  street: z.string().min(3, 'Street address is required.'),
  city: z.string().min(2, 'City is required.'),
  zipCode: z.string().min(4, 'Postal/ZIP code is required.'),
  country: z.string().min(2, 'Country is required.'),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  addressToEdit?: Address | null;
  isSubmitting: boolean;
  onSubmit: (values: AddressFormValues) => void;
  onCancel: () => void;
}

export function AddressForm({ addressToEdit, isSubmitting, onSubmit, onCancel }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressToEdit || {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      zipCode: '',
      country: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    form.reset(addressToEdit || {
        fullName: '',
        phone: '',
        street: '',
        city: '',
        zipCode: '',
        country: '',
        isDefault: false,
      });
  }, [addressToEdit, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{addressToEdit ? 'Edit Address' : 'Add New Address'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number <span className="text-muted-foreground">(Optional)</span></FormLabel>
                        <FormControl>
                            <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                            <Input placeholder="123 Mask Lane" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Venice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP / Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as default shipping address
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {addressToEdit ? 'Save Changes' : 'Add Address'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
