
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Loader2, UploadCloud, X, AlertTriangle } from 'lucide-react';
import type { Banner } from '@/lib/types';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  targetUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  cta: z.string().optional(),
});

type BannerFormValues = z.infer<typeof formSchema>;

interface BannerFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  bannerToEdit: Banner | null;
  onSubmit: (values: BannerFormValues, image: File | string) => Promise<void>;
  isSubmitting: boolean;
}

const MIN_WIDTH = 1920;
const MIN_HEIGHT = 800;

export function BannerForm({
  isOpen,
  onOpenChange,
  bannerToEdit,
  onSubmit,
  isSubmitting,
}: BannerFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);


  const form = useForm<BannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      targetUrl: '',
      cta: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (bannerToEdit) {
        form.reset(bannerToEdit);
        setImagePreview(bannerToEdit.imageUrl);
      } else {
        form.reset({
          title: '',
          description: '',
          targetUrl: '',
          cta: '',
        });
        setImagePreview(null);
      }
      setSelectedFile(null);
      setImageWarning(null);
    }
  }, [isOpen, bannerToEdit, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);

        const img = document.createElement('img');
        img.onload = () => {
          if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
            setImageWarning(`Image is ${img.width}x${img.height}px. Recommended size is at least ${MIN_WIDTH}x${MIN_HEIGHT}px for best quality.`);
          } else {
            setImageWarning(null);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: BannerFormValues) => {
    const imageSource = selectedFile || (bannerToEdit ? bannerToEdit.imageUrl : null);
    if (!imageSource) {
      form.setError('root', { message: 'An image is required.' });
      return;
    }
    await onSubmit(data, imageSource);
  };
  
  const clearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setImageWarning(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bannerToEdit ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
          <DialogDescription>
            {bannerToEdit ? 'Update the details for this banner.' : 'Upload an image and add details for a new banner.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel>Banner Image</FormLabel>
                {imagePreview ? (
                  <div className="relative aspect-video w-full rounded-md overflow-hidden group">
                    <Image src={imagePreview} alt="Banner preview" fill className="object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                )}
                 <div className="text-xs text-muted-foreground italic mt-2 space-y-1">
                    <p>Recommended size: 1920×800px (16:9 or 21:9 aspect ratio).</p>
                    <p>Minimum mobile safe area: 1080×1080px (center of the image).</p>
                </div>
                 {imageWarning && (
                    <Alert variant="destructive" className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 mt-0.5"/>
                        <AlertDescription className="text-xs">
                        {imageWarning}
                        </AlertDescription>
                    </Alert>
                )}
                 {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                )}
              </div>
              <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Summer Sale" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Short description..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="targetUrl" render={({ field }) => (
                  <FormItem><FormLabel>Link URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/products/sale" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cta" render={({ field }) => (
                  <FormItem><FormLabel>Button Text (Optional)</FormLabel><FormControl><Input placeholder="e.g. Shop Now" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bannerToEdit ? 'Save Changes' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
