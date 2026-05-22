
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
import { useTranslation } from '@/components/language/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emirates = [
    { value: 'abu_dhabi', label: 'abu_dhabi' },
    { value: 'dubai', label: 'dubai' },
    { value: 'sharjah', label: 'sharjah' },
    { value: 'ajman', label: 'ajman' },
    { value: 'umm_al_quwain', label: 'umm_al_quwain' },
    { value: 'ras_al_khaimah', label: 'ras_al_khaimah' },
    { value: 'fujairah', label: 'fujairah' },
];

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  street: z.string().min(3, 'Street address is required.'),
  city: z.string().min(2, 'City is required.'),
  emirate: z.string().min(1, 'Please select an emirate.'),
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
  const { t } = useTranslation();
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressToEdit || {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      emirate: '',
      zipCode: '',
      country: 'United Arab Emirates',
      isDefault: false,
    },
  });

  useEffect(() => {
    form.reset(addressToEdit || {
        fullName: '',
        phone: '',
        street: '',
        city: '',
        emirate: '',
        zipCode: '',
        country: 'United Arab Emirates',
        isDefault: false,
      });
  }, [addressToEdit, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle {...t(addressToEdit ? 'edit_address' : 'add_new_address')}>
            {addressToEdit ? t('edit_address').text : t('add_new_address').text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel {...t('full_name')}>{t('full_name').text}</FormLabel>
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
                        <FormLabel {...t('phone_number')}>{t('phone_number').text}</FormLabel>
                        <FormControl>
                            <Input placeholder="+971 50 000 0000" {...field} />
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
                        <FormLabel {...t('street_address')}>{t('street_address').text}</FormLabel>
                        <FormControl>
                            <Input placeholder="123 Mask Lane" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="emirate" render={({ field }) => (
                    <FormItem>
                        <FormLabel {...t('emirate')}>{t('emirate').text}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('emirate').text} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {emirates.map(e => (
                                    <SelectItem key={e.value} value={e.value}>{t(e.label as any).text}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel {...t('city')}>{t('city').text}</FormLabel>
                        <FormControl>
                            <Input placeholder="Area name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel {...t('postal_code')}>{t('postal_code').text}</FormLabel>
                    <FormControl>
                      <Input placeholder="00000" {...field} />
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
                    <FormLabel {...t('country')}>{t('country').text}</FormLabel>
                    <FormControl>
                      <Input placeholder="UAE" {...field} disabled />
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
                    <FormLabel {...t('set_as_default_address')}>
                      {t('set_as_default_address').text}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    {t('cancel').text}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {addressToEdit ? t('save_changes').text : t('add_address').text}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
