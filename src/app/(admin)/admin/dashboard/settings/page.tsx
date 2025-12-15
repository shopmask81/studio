
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { uploadImage, saveSettings } from './services/settings-service';
import initialSettings from '@/../appData/siteSettings.json';
import initialEn from '@/locales/en.json';
import initialAr from '@/locales/ar.json';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Currency } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

const generalFormSchema = z.object({
  siteName: z.string().min(3, 'Site name must be at least 3 characters.'),
  contactEmail: z.string().email('Invalid email address.'),
  contactPhone: z.string().min(1, 'Contact phone is required.'),
  storeAddress: z.string().min(10, 'Store address is required.'),
  defaultThemeMode: z.enum(['light', 'dark']),
  defaultCurrency: z.enum(['AED', 'MAD', 'USD', 'EUR']),
  payments: z.object({
    creditCard: z.boolean().default(false),
    paypal: z.boolean().default(false),
    cod: z.boolean().default(true),
  }),
  imgbbApiKey: z.string().min(1, 'ImgBB API key is required.'),
  enableWhatsAppButton: z.boolean().default(false),
  whatsAppUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.enableWhatsAppButton && !data.whatsAppUrl) {
        ctx.addIssue({
            path: ['whatsAppUrl'],
            message: 'WhatsApp URL is required when the button is enabled.',
        });
    }
});

const contentFormSchema = z.object({
    discover_persona: z.string().min(1, "English title is required."),
    discover_persona_ar: z.string().min(1, "Arabic title is required."),
    explore_collection: z.string().min(1, "English description is required."),
    explore_collection_ar: z.string().min(1, "Arabic description is required."),
    about_title: z.string().min(1, "English title is required."),
    about_title_ar: z.string().min(1, "Arabic title is required."),
    about_p1: z.string().min(1, "English content is required."),
    about_p1_ar: z.string().min(1, "Arabic content is required."),
    terms_title: z.string().min(1, "English title is required."),
    terms_title_ar: z.string().min(1, "Arabic title is required."),
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

const currencies: { code: Currency; name: string }[] = [
  { code: 'AED', name: 'United Arab Emirates Dirham' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
];

const ImageUploader = ({ title, description, imageState, onFileChange, onUpload, isUploading, apiKeyPresent }: { title: string; description: string; imageState: ImageState; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onUpload: () => void; isUploading: boolean; apiKeyPresent: boolean; }) => {
    return (
      <div className="space-y-2">
        <FormLabel>{title}</FormLabel>
        <div className="flex items-start gap-4">
          {imageState.previewUrl ? (
            <div className="relative h-20 w-20 rounded-md border p-1 flex items-center justify-center bg-muted">
              <Image src={imageState.previewUrl} alt={`${title} preview`} width={72} height={72} className="object-contain" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-md border flex items-center justify-center text-muted-foreground bg-muted">
              <p className="text-xs">None</p>
            </div>
          )}
          <div className="flex-grow space-y-2">
             <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors min-h-20">
              <div className="flex flex-col items-center justify-center text-center p-2">
                <UploadCloud className="w-5 h-5 mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{imageState.file ? imageState.file.name : 'Click to select file'}</p>
              </div>
              <input type="file" className="hidden" onChange={onFileChange} accept="image/png, image/jpeg, image/svg+xml, image/ico" />
            </label>
             <Button 
                type="button" 
                size="sm" 
                className="w-full"
                onClick={onUpload} 
                disabled={!imageState.file || isUploading || !apiKeyPresent}
            >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload
            </Button>
          </div>
        </div>
        <FormDescription>{description}</FormDescription>
      </div>
    );
  };


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
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
    defaultValues: {
      ...initialSettings,
      defaultThemeMode: initialSettings.defaultThemeMode || 'light',
      defaultCurrency: initialSettings.defaultCurrency || 'AED',
      payments: initialSettings.payments || { creditCard: false, paypal: false, cod: true },
      imgbbApiKey: initialSettings.imgbbApiKey || '',
      enableWhatsAppButton: initialSettings.enableWhatsAppButton ?? false,
      whatsAppUrl: initialSettings.whatsAppUrl || '',
    },
  });
  
  const contentForm = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
        discover_persona: initialEn.discover_persona,
        discover_persona_ar: initialAr.discover_persona,
        explore_collection: initialEn.explore_collection,
        explore_collection_ar: initialAr.explore_collection,
        about_title: initialEn.about_title,
        about_title_ar: initialAr.about_title_ar,
        about_p1: initialEn.about_p1,
        about_p1_ar: initialAr.about_p1_ar,
        terms_title: initialEn.terms_title,
        terms_title_ar: initialAr.terms_title_ar,
        terms_en: initialEn.terms_en,
        terms_ar: initialAr.terms_ar,
        privacy_policy_title: initialEn.privacy_policy_title,
        privacy_policy_title_ar: initialAr.privacy_policy_title_ar,
        privacy_policy_content: initialEn.privacy_policy_content,
        privacy_policy_content_ar: initialAr.privacy_policy_content_ar,
    },
  });
  
  const apiKey = generalForm.watch('imgbbApiKey');

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
    setter: React.Dispatch<React.SetStateAction<ImageState>>,
    apiKey: string
  ) => {
    if (!imageState.file) return;
    if (!apiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: 'Please provide the ImgBB API key before uploading.' });
      return;
    }
    setter(prev => ({ ...prev, isUploading: true }));
    try {
      const { url } = await uploadImage(imageState.file, apiKey);
      setter(prev => ({ ...prev, previewUrl: url, file: null, isUploading: false }));
      toast({ title: 'Image Uploaded', description: 'The new image is ready. Click "Save All Changes" to apply it to your site.' });
      return url;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message || 'Could not upload the image.' });
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

    const generalData = generalForm.getValues();
    const contentData = contentForm.getValues();

    try {
      const finalSettings = {
        ...generalData,
        logoUrl: logo.previewUrl || '',
        faviconUrl: favicon.previewUrl || '',
      };
      
      const finalContent = {
          en: {
              ...initialEn,
              discover_persona: contentData.discover_persona,
              explore_collection: contentData.explore_collection,
              about_title: contentData.about_title,
              about_p1: contentData.about_p1,
              terms_title: contentData.terms_title,
              terms_en: contentData.terms_en,
              privacy_policy_title: contentData.privacy_policy_title,
              privacy_policy_content: contentData.privacy_policy_content,
          },
          ar: {
              ...initialAr,
              discover_persona: contentData.discover_persona_ar,
              explore_collection: contentData.explore_collection_ar,
              about_title_ar: contentData.about_title_ar,
              about_p1_ar: contentData.about_p1_ar,
              terms_title_ar: contentData.terms_title_ar,
              terms_ar: contentData.terms_ar,
              privacy_policy_title_ar: contentData.privacy_policy_title_ar,
              privacy_policy_content_ar: contentData.privacy_policy_content_ar,
          }
      };

      await saveSettings({ general: finalSettings, content: finalContent });
      toast({ title: 'Settings Saved', description: 'Your site settings have been updated successfully. The page will now reload to apply changes.' });

      setTimeout(() => {
        window.location.reload();
      }, 1500);


    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
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
                                        <FormField control={generalForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={generalForm.control} name="storeAddress" render={({ field }) => (<FormItem><FormLabel>Store Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField
                                            control={generalForm.control}
                                            name="defaultThemeMode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Default Theme Mode</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a default theme" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="light">Light</SelectItem>
                                                            <SelectItem value="dark">Dark</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        This is the default theme applied to visitors on first load.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={generalForm.control}
                                            name="defaultCurrency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Default Currency</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a default currency" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {currencies.map(c => (
                                                                <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        This is the default currency displayed on the website.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                         <FormField control={generalForm.control} name="imgbbApiKey" render={({ field }) => (<FormItem><FormLabel>Image Upload API Key (imgbb)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <ImageUploader 
                                            title="Site Logo" 
                                            description="Recommended: PNG or SVG, 256x256px." 
                                            imageState={logo} 
                                            onFileChange={(e) => handleFileChange(e, setLogo)}
                                            onUpload={() => handleUpload(logo, setLogo, apiKey)}
                                            isUploading={logo.isUploading}
                                            apiKeyPresent={!!apiKey}
                                        />
                                        <ImageUploader 
                                            title="Favicon" 
                                            description="Recommended: .ico or PNG, 32x32px or 16x16px." 
                                            imageState={favicon} 
                                            onFileChange={(e) => handleFileChange(e, setFavicon)}
                                            onUpload={() => handleUpload(favicon, setFavicon, apiKey)}
                                            isUploading={favicon.isUploading}
                                            apiKeyPresent={!!apiKey}
                                        />
                                    </div>
                                </div>
                                <Separator className="my-8" />
                                <div>
                                    <h3 className="text-lg font-medium mb-4">WhatsApp Support Button</h3>
                                    <div className="space-y-6">
                                         <FormField
                                            control={generalForm.control}
                                            name="enableWhatsAppButton"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Enable WhatsApp Button</FormLabel>
                                                    <FormDescription>Show a floating WhatsApp button on all public pages.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={generalForm.control}
                                            name="whatsAppUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>WhatsApp Chat URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://wa.me/yourNumber" {...field} />
                                                    </FormControl>
                                                    <FormDescription>The full URL that the button will link to (opens in a new tab).</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="payment-methods" className="border rounded-lg">
          <AccordionTrigger className="text-xl font-semibold px-6">Checkout Payment Methods</AccordionTrigger>
          <AccordionContent>
            <Card className="border-none">
              <CardContent className="pt-6">
                <Form {...generalForm}>
                    <div className="space-y-6">
                      <FormField
                        control={generalForm.control}
                        name="payments.creditCard"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Credit Card</FormLabel>
                              <FormDescription>Allow customers to pay with credit or debit cards.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name="payments.paypal"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable PayPal</FormLabel>
                              <FormDescription>Allow customers to pay using their PayPal account.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name="payments.cod"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Cash on Delivery</FormLabel>
                              <FormDescription>Allow customers to pay upon delivery of their order.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
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
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={contentForm.control} name="discover_persona" render={({ field }) => (<FormItem><FormLabel>Main Title (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={contentForm.control} name="discover_persona_ar" render={({ field }) => (<FormItem><FormLabel>Main Title (Arabic)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <hr/>
                                    <Controller
                                        control={contentForm.control}
                                        name="explore_collection"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description (English)</FormLabel>
                                                <FormControl><RichTextEditor content={field.value} onChange={field.onChange} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={contentForm.control}
                                        name="explore_collection_ar"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description (Arabic)</FormLabel>
                                                <FormControl><RichTextEditor content={field.value} onChange={field.onChange} dir="rtl" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={contentForm.control} name="about_title" render={({ field }) => (<FormItem><FormLabel>Main Title (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={contentForm.control} name="about_title_ar" render={({ field }) => (<FormItem><FormLabel>Main Title (Arabic)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <hr/>
                                    <Controller control={contentForm.control} name="about_p1" render={({ field }) => (<FormItem><FormLabel>Full Content (English)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                                    <Controller control={contentForm.control} name="about_p1_ar" render={({ field }) => (<FormItem><FormLabel>Full Content (Arabic)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} dir="rtl" /></FormControl><FormMessage /></FormItem>)} />
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={contentForm.control} name="terms_title" render={({ field }) => (<FormItem><FormLabel>Main Title (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={contentForm.control} name="terms_title_ar" render={({ field }) => (<FormItem><FormLabel>Main Title (Arabic)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <hr/>
                                    <Controller control={contentForm.control} name="terms_en" render={({ field }) => (<FormItem><FormLabel>Full Content (English)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                                    <Controller control={contentForm.control} name="terms_ar" render={({ field }) => (<FormItem><FormLabel>Full Content (Arabic)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} dir="rtl" /></FormControl><FormMessage /></FormItem>)} />
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
                                    <Controller control={contentForm.control} name="privacy_policy_content" render={({ field }) => (<FormItem><FormLabel>Full Content (English)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                                    <Controller control={contentForm.control} name="privacy_policy_content_ar" render={({ field }) => (<FormItem><FormLabel>Full Content (Arabic)</FormLabel><FormControl><RichTextEditor content={field.value} onChange={field.onChange} dir="rtl" /></FormControl><FormMessage /></FormItem>)} />
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
