
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters long.'),
  name_ar: z.string().min(2, 'Category name (Arabic) must be at least 2 characters long.'),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categoryToEdit: Category | null;
  onSubmit: (name: string, name_ar: string) => void;
  isSubmitting: boolean;
}

export function CategoryFormDialog({
  isOpen,
  onOpenChange,
  categoryToEdit,
  onSubmit,
  isSubmitting,
}: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      name_ar: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ 
        name: categoryToEdit?.name || '',
        name_ar: categoryToEdit?.name_ar || '',
      });
    }
  }, [isOpen, categoryToEdit, form]);

  const handleFormSubmit = (data: CategoryFormValues) => {
    onSubmit(data.name, data.name_ar);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {categoryToEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {categoryToEdit
              ? 'Update the names of the category.'
              : 'Create a new category for your products.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Venetian Masks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: أقنعة فينيسية" {...field} dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {categoryToEdit ? 'Save Changes' : 'Create Category'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
