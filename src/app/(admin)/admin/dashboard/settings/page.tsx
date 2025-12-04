
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { uploadImage, saveSettings } from './services/settings-service';
import initialSettings from '@/../appData/siteSettings.json';
import initialEn from '@/locales/en.json';
import initialAr from '@/locales/ar.json';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const generalFormSchema = z.object({
  siteName: z.string().min(3, 'Site name must be at least 3 characters.'),
  siteDescription: z.string().min(10, 'Site description is required.'),
  contactEmail: z.string().email('Invalid email address.'),
  contactPhone: z.string().min(1, 'Contact phone is required.'),
  storeAddress: z.string().min(10, 'Store address is required.'),
});

const contentFormSchema = z.object({
    explore_collection: z.string().min(1, "English description is required."),
    explore_collection_ar: z.string().min(1, "Arabic description is required."),
    about_p1: z.string().min(1, "English content is required."),
    about_p1_ar: z.string().min(1, "Arabic content is required."),
    about_p2: z.string().min(1, "English content is required."),
    about_p2_ar: z.string().min(1, "Arabic content is required."),
    about_p3: z.string().min(1, "English content is required."),
    about_p3_ar: z.string().min(1, "Arabic content is required."),
    terms_en: z.string().min(1, "English content is required."),
    terms_ar: z.string().min(1, "Arabic content is required."),
    privacy_policy_title: z.string().min(1, "English title is required."),
    privacy_policy_title_ar: z.string().min(1, "Arabic title is required."),
    privacy_policy_content: z.string().min(1, "English content is required."),
    privacy_policy_content_ar: z.string().min(1, "Arabic content is required."),
});


type GeneralFormValues = z.infer<typeof generalFormSchema>;
type ContentFormValues = z.infer<typeof contentFormSchema>;

type ImageState = {
  file: File | null;
  previewUrl: string | null;
  isUploading: boolean;
};

// Properly defined standalone helper component
const ImageUploader = ({ title, description, imageState, onFileChange }: { title: string; description: string; imageState: ImageState; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => {
  return (
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

  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: initialSettings,
  });
  
  const contentForm = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
        explore_collection: initialEn.explore_collection,
        explore_collection_ar: initialAr.explore_collection,
        about_p1: initialEn.about_p1,
        about_p1_ar: initialAr.about_p1_ar,
        about_p2: initialEn.about_p2,
        about_p2_ar: initialAr.about_p2_ar,
        about_p3: initialEn.about_p3,
        about_p3_ar: initialAr.about_p3_ar,
        terms_en: initialEn.terms_en,
        terms_ar: initialAr.terms_ar,
        privacy_policy_title: initialEn.privacy_policy_title,
        privacy_policy_title_ar: initialAr.privacy_policy_title_ar,
        privacy_policy_content: initialEn.privacy_policy_content,
        privacy_policy_content_ar: initialAr.privacy_policy_content_ar,
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
    if (!imageState.file) return null;
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

  const handleSave = async () => {
    setIsSaving(true);
    
    const isGeneralValid = await generalForm.trigger();
    const isContentValid = await contentForm.trigger();

    if (!isGeneralValid || !isContentValid) {
        toast({
            variant: 'destructive',
            title: 'Validation Failed',
            description: 'Please check all fields and try again.',
        });
        setIsSaving(false);
        return;
    }

    let finalLogoUrl = logo.previewUrl;
    let finalFaviconUrl = favicon.previewUrl;

    try {
      // Handle image uploads first
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

      const generalData = generalForm.getValues();
      const contentData = contentForm.getValues();

      const finalSettings = {
        ...generalData,
        logoUrl: finalLogoUrl || '',
        faviconUrl: finalFaviconUrl || '',
      };
      
      const finalContent = {
          en: {
              ...initialEn, // Preserve other keys
              explore_collection: contentData.explore_collection,
              about_p1: contentData.about_p1,
              about_p2: contentData.about_p2,
              about_p3: contentData.about_p3,
              terms_en: contentData.terms_en,
              privacy_policy_title: contentData.privacy_policy_title,
              privacy_policy_content: contentData.privacy_policy_content,
          },
          ar: {
              ...initialAr, // Preserve other keys
              explore_collection: contentData.explore_collection_ar,
              about_p1: contentData.about_p1_ar,
              about_p2: contentData.about_p2_ar,
              about_p3: contentData.about_p3_ar,
              terms_ar: contentData.terms_ar,
              privacy_policy_title: contentData.privacy_policy_title_ar,
              privacy_policy_content: contentData.privacy_policy_content_ar,
          }
      };

      await saveSettings({ general: finalSettings, content: finalContent });
      toast({ title: 'Settings Saved', description: 'Your site settings have been updated successfully.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <Button onClick={handleSave} disabled={isSaving || logo.isUploading || favicon.isUploading}>
            {(isSaving || logo.isUploading || favicon.isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save All Changes
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['general-info']} className="w-full space-y-4">
        <AccordionItem value="general-info" className="border rounded-lg">
            <AccordionTrigger className="text-xl font-semibold px-6">General Information</AccordionTrigger>
            <AccordionContent>
                <Card className="border-none">
                    <CardContent className="pt-6">
                        <Form {...generalForm}>
                            <form className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <FormField control={generalForm.control} name="siteName" render={({ field }) => (<FormItem><FormLabel>Site Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="siteDescription" render={({ field }) => (<FormItem><FormLabel>Site Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="storeAddress" render={({ field }) => (<FormItem><FormLabel>Store Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="space-y-6">
                                        <ImageUploader title="Site Logo" description="Recommended: PNG or SVG, 256x256px." imageState={logo} onFileChange={(e) => handleFileChange(e, setLogo)} />
                                        <ImageUploader title="Favicon" description="Recommended: .ico or PNG, 32x32px or 16x16px." imageState={favicon} onFileChange={(e) => handleFileChange(e, setFavicon)} />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
        
        <Form {...contentForm}>
            <form>
                <AccordionItem value="homepage-content" className="border rounded-lg">
                    <AccordionTrigger className="text-xl font-semibold px-6">Homepage Content</AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-none">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <FormField control={contentForm.control} name="explore_collection" render={({ field }) => (<FormItem><FormLabel>Description (English)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="explore_collection_ar" render={({ field }) => (<FormItem><FormLabel>Description (Arabic)</FormLabel><FormControl><Textarea dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="about-page" className="border rounded-lg">
                    <AccordionTrigger className="text-xl font-semibold px-6">About Page</AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-none">
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <FormField control={contentForm.control} name="about_p1" render={({ field }) => (<FormItem><FormLabel>Paragraph 1 (English)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="about_p1_ar" render={({ field }) => (<FormItem><FormLabel>Paragraph 1 (Arabic)</FormLabel><FormControl><Textarea rows={5} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="about_p2" render={({ field }) => (<FormItem><FormLabel>Paragraph 2 (English)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="about_p2_ar" render={({ field }) => (<FormItem><FormLabel>Paragraph 2 (Arabic)</FormLabel><FormControl><Textarea rows={5} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="about_p3" render={({ field }) => (<FormItem><FormLabel>Paragraph 3 (English)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="about_p3_ar" render={({ field }) => (<FormItem><FormLabel>Paragraph 3 (Arabic)</FormLabel><FormControl><Textarea rows={5} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="terms-page" className="border rounded-lg">
                    <AccordionTrigger className="text-xl font-semibold px-6">Terms of Use Page</AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-none">
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <FormField control={contentForm.control} name="terms_en" render={({ field }) => (<FormItem><FormLabel>Content (English)</FormLabel><FormControl><Textarea rows={10} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="terms_ar" render={({ field }) => (<FormItem><FormLabel>Content (Arabic)</FormLabel><FormControl><Textarea rows={10} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="privacy-page" className="border rounded-lg">
                    <AccordionTrigger className="text-xl font-semibold px-6">Privacy Policy Page</AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-none">
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={contentForm.control} name="privacy_policy_title" render={({ field }) => (<FormItem><FormLabel>Main Title (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={contentForm.control} name="privacy_policy_title_ar" render={({ field }) => (<FormItem><FormLabel>Main Title (Arabic)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <hr />
                                    <FormField control={contentForm.control} name="privacy_policy_content" render={({ field }) => (<FormItem><FormLabel>Full Content (English)</FormLabel><FormControl><Textarea rows={15} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={contentForm.control} name="privacy_policy_content_ar" render={({ field }) => (<FormItem><FormLabel>Full Content (Arabic)</FormLabel><FormControl><Textarea rows={15} dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </form>
        </Form>
      </Accordion>
    </div>
  );
}
