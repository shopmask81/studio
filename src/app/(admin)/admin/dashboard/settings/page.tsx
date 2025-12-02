
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { uploadImage, saveSettings } from './services/settings-service';
import initialSettings from '@/data/siteSettings.json' assert { type: 'json' };

const formSchema = z.object({
  siteName: z.string().min(3, 'Site name must be at least 3 characters.'),
  siteDescription: z.string().min(10, 'Site description is required.'),
  contactEmail: z.string().email('Invalid email address.'),
  contactPhone: z.string().min(1, 'Contact phone is required.'),
  storeAddress: z.string().min(10, 'Store address is required.'),
});

type SettingsFormValues = z.infer<typeof formSchema>;

type ImageState = {
  file: File | null;
  previewUrl: string | null;
  isUploading: boolean;
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [logo, setLogo] = useState<ImageState>({
    file: null,
    previewUrl: initialSettings.logoUrl,
    isUploading: false,
  });

  const [favicon, setFavicon] = useState<ImageState>({
    file: null,
    previewUrl: initialSettings.faviconUrl,
    isUploading: false,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: initialSettings.siteName,
      siteDescription: initialSettings.siteDescription,
      contactEmail: initialSettings.contactEmail,
      contactPhone: initialSettings.contactPhone,
      storeAddress: initialSettings.storeAddress,
    },
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setter(prev => ({
        ...prev,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleUpload = async (
    imageState: ImageState,
    setter: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    if (!imageState.file) return;

    setter(prev => ({ ...prev, isUploading: true }));
    try {
      const { url } = await uploadImage(imageState.file);
      setter(prev => ({ ...prev, previewUrl: url, file: null, isUploading: false }));
      toast({ title: 'Image Uploaded', description: 'The image has been successfully uploaded.' });
      return url;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the image.' });
      setter(prev => ({ ...prev, isUploading: false }));
      return null;
    }
  };

  async function onSubmit(data: SettingsFormValues) {
    setIsSaving(true);
    let finalLogoUrl = logo.previewUrl;
    let finalFaviconUrl = favicon.previewUrl;

    try {
      if (logo.file) {
        const uploadedUrl = await handleUpload(logo, setLogo);
        if (uploadedUrl) finalLogoUrl = uploadedUrl;
        else throw new Error("Logo upload failed.");
      }

      if (favicon.file) {
        const uploadedUrl = await handleUpload(favicon, setFavicon);
        if (uploadedUrl) finalFaviconUrl = uploadedUrl;
        else throw new Error("Favicon upload failed.");
      }

      const finalSettings = {
        ...data,
        logoUrl: finalLogoUrl || '',
        faviconUrl: finalFaviconUrl || '',
      };

      await saveSettings(finalSettings);
      toast({ title: 'Settings Saved', description: 'Your site settings have been updated.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  const ImageUploader = ({
    title,
    description,
    imageState,
    onFileChange,
  }: {
    title: string;
    description: string;
    imageState: ImageState;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="space-y-2">
      <FormLabel>{title}</FormLabel>
      <div className="flex items-center gap-4">
        {imageState.previewUrl ? (
          <div className="relative h-16 w-16 rounded-md border p-1 flex items-center justify-center bg-muted">
            <Image src={imageState.previewUrl} alt={`${title} preview`} width={60} height={60} className="object-contain" />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-md border flex items-center justify-center text-muted-foreground bg-muted">
            <p className="text-xs">None</p>
          </div>
        )}
        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors max-h-16">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <UploadCloud className="w-5 h-5 mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Click to upload</p>
          </div>
          <input type="file" className="hidden" onChange={onFileChange} accept="image/png, image/jpeg, image/svg+xml, image/ico" />
        </label>
      </div>
      <FormDescription>{description}</FormDescription>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Site Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Update your site's name, description, and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Text Fields */}
                <div className="space-y-6">
                  <FormField control={form.control} name="siteName" render={({ field }) => (
                    <FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="siteDescription" render={({ field }) => (
                    <FormItem><FormLabel>Site Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="storeAddress" render={({ field }) => (
                    <FormItem><FormLabel>Store Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {/* Image Fields */}
                <div className="space-y-6">
                  <ImageUploader 
                    title="Site Logo" 
                    description="Recommended: PNG or SVG, 256x256px."
                    imageState={logo} 
                    onFileChange={(e) => handleFileChange(e, setLogo)} 
                  />
                  <ImageUploader 
                    title="Favicon" 
                    description="Recommended: .ico or PNG, 32x32px or 16x16px."
                    imageState={favicon} 
                    onFileChange={(e) => handleFileChange(e, setFavicon)} 
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || logo.isUploading || favicon.isUploading}>
                  {(isSaving || logo.isUploading || favicon.isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
