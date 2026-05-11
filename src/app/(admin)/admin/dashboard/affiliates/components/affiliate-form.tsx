
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Affiliate } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  code: z.string().min(3, 'Code must be at least 3 characters.').toUpperCase().trim(),
  commissionRate: z.coerce.number().min(0, 'Rate must be at least 0').max(1, 'Rate cannot exceed 1 (100%)'),
});

type AffiliateFormValues = z.infer<typeof formSchema>;

interface AffiliateFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  affiliateToEdit: Affiliate | null;
  onSubmit: (values: AffiliateFormValues) => void;
  isSubmitting: boolean;
}

export function AffiliateForm({
  isOpen,
  onOpenChange,
  affiliateToEdit,
  onSubmit,
  isSubmitting,
}: AffiliateFormProps) {
  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      code: '',
      commissionRate: 0.1, // Default 10%
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (affiliateToEdit) {
        form.reset({
          name: affiliateToEdit.name,
          email: affiliateToEdit.email,
          code: affiliateToEdit.code,
          commissionRate: affiliateToEdit.commissionRate,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          code: '',
          commissionRate: 0.1,
        });
      }
    }
  }, [isOpen, affiliateToEdit, form]);

  const handleFormSubmit = (data: AffiliateFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {affiliateToEdit ? 'Edit Affiliate' : 'Add New Affiliate'}
          </DialogTitle>
          <DialogDescription>
            Configure the affiliate details and commission percentage.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormDescription>Must match an existing user's email.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Affiliate Code</FormLabel>
                        <FormControl>
                            <Input placeholder="SAVE10" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Commission (0 to 1)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0.10" {...field} />
                        </FormControl>
                        <FormDescription>e.g. 0.15 = 15%</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {affiliateToEdit ? 'Save Changes' : 'Create Affiliate'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
