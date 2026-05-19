
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
import { Input, PasswordInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Affiliate } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),
  code: z.string().min(3, 'Code must be at least 3 characters.').toUpperCase().trim(),
  commissionRate: z.coerce.number().min(0, 'Rate must be at least 0').max(100, 'Rate cannot exceed 100%'),
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
      password: '',
      code: '',
      commissionRate: 10, // Default 10%
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (affiliateToEdit) {
        form.reset({
          name: affiliateToEdit.name,
          email: affiliateToEdit.email,
          password: '',
          code: affiliateToEdit.code,
          // Convert stored decimal (0.1) to percentage (10) for UI
          commissionRate: Math.round(affiliateToEdit.commissionRate * 100),
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          code: '',
          commissionRate: 10,
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
            {affiliateToEdit 
                ? 'Update affiliate details.' 
                : 'Enter details and a password to create a new affiliate account.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {!affiliateToEdit && (
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Login Password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder="******" {...field} />
                            </FormControl>
                            <FormDescription className="text-[10px]">Will create a new user account.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
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
                        <FormLabel>Commission (%)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type="number" placeholder="10" {...field} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <DialogFooter className="pt-4">
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
