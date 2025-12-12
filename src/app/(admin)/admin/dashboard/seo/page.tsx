
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, AlertTriangle, Info, Save } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MAX_TITLE_LENGTH = 60;
const MAX_DESC_LENGTH = 160;

const seoSchema = z.object({
  focusKeyword: z.string().min(1, 'Focus keyword is required.'),
  relatedKeywords: z.array(z.string()).min(1, 'At least one related keyword is required.'),
  metaTitle: z.string().min(1, 'Meta title is required.').max(MAX_TITLE_LENGTH, `Meta title must be ${MAX_TITLE_LENGTH} characters or less.`),
  metaDescription: z.string().min(1, 'Meta description is required.').max(MAX_DESC_LENGTH, `Meta description must be ${MAX_DESC_LENGTH} characters or less.`),
  ogTitle: z.string().min(1, 'OpenGraph title is required.'),
  ogDescription: z.string().min(1, 'OpenGraph description is required.'),
});

type SeoFormValues = z.infer<typeof seoSchema>;

type ImageState = {
  file: File | null;
  previewUrl: string | null;
};

const KeywordsInput = ({ value, onChange }: { value: string[]; onChange: (keywords: string[]) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newKeyword = inputValue.trim();
      if (newKeyword && !value.includes(newKeyword)) {
        onChange([...value, newKeyword]);
      }
      setInputValue('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    onChange(value.filter(keyword => keyword !== keywordToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-md border p-2">
        {value.map(keyword => (
          <div key={keyword} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
            {keyword}
            <button type="button" onClick={() => removeKeyword(keyword)}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow border-none shadow-none focus-visible:ring-0 p-0 h-auto"
          placeholder="Type keyword and press Enter..."
        />
      </div>
    </div>
  );
};


export default function SeoSettingsPage() {
  const { toast } = useToast();
  const [isSavingHomepageSeo, setIsSavingHomepageSeo] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState<'robots' | 'sitemap' | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [ogImage, setOgImage] = useState<ImageState>({ file: null, previewUrl: null });
  const [robotsContent, setRobotsContent] = useState('');
  const [sitemapContent, setSitemapContent] = useState('');


  const enForm = useForm<SeoFormValues>({ resolver: zodResolver(seoSchema), defaultValues: { relatedKeywords: [] } });
  const arForm = useForm<SeoFormValues>({ resolver: zodResolver(seoSchema), defaultValues: { relatedKeywords: [] } });

  const watchedEnDescription = enForm.watch('metaDescription');
  const watchedEnFocusKeyword = enForm.watch('focusKeyword');

  const focusKeywordWarning = watchedEnFocusKeyword && watchedEnDescription && !watchedEnDescription.toLowerCase().includes(watchedEnFocusKeyword.toLowerCase());

  useEffect(() => {
    async function fetchSeoData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/seo');
        if (!response.ok) throw new Error('Failed to fetch SEO data');
        const data = await response.json();
        
        if (data.en?.homepage) {
          enForm.reset(data.en.homepage);
        }
        if (data.ar?.homepage) {
          arForm.reset(data.ar.homepage);
        }
        
        setOgImage(prev => ({ ...prev, previewUrl: data.en?.homepage?.ogImage || null }));

        setRobotsContent(data.robots);
        setSitemapContent(data.sitemap);

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading data', description: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeoData();
  }, [enForm, arForm, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOgImage({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleSaveHomepageSeo = async () => {
    setIsSavingHomepageSeo(true);
    const isEnValid = await enForm.trigger();
    const isArValid = await arForm.trigger();
    if (!isEnValid || !isArValid) {
      toast({ variant: 'destructive', title: 'Validation Failed', description: 'Please check all fields in both languages.' });
      setIsSavingHomepageSeo(false);
      return;
    }

    const enData = enForm.getValues();
    const arData = arForm.getValues();

    try {
        const formData = new FormData();
        formData.append('enHomepage', JSON.stringify(enData));
        formData.append('arHomepage', JSON.stringify(arData));
        if (ogImage.file) {
            formData.append('ogImageFile', ogImage.file);
        }
        
        const response = await fetch('/api/seo', {
            method: 'POST',
            body: formData,
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings.');
      }

      toast({ title: 'Homepage SEO Saved', description: 'Your homepage SEO settings have been updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
    } finally {
      setIsSavingHomepageSeo(false);
    }
  };

  const handleSaveFile = async (fileType: 'robots' | 'sitemap') => {
    setIsSavingFile(fileType);
    
    try {
        const formData = new FormData();
        if (fileType === 'robots') {
            formData.append('robots', robotsContent);
        } else {
            formData.append('sitemap', sitemapContent);
        }
        
        const response = await fetch('/api/seo', {
            method: 'POST',
            body: formData,
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save ${fileType}.`);
      }

      toast({ title: `${fileType === 'robots' ? 'robots.txt' : 'sitemap.xml'} Saved`, description: 'The file has been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
    } finally {
      setIsSavingFile(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">Homepage SEO</CardTitle>
                        <CardDescription>
                          These settings control how your homepage appears on search engines and social media.
                        </CardDescription>
                    </div>
                    <Button onClick={handleSaveHomepageSeo} disabled={isSavingHomepageSeo}>
                        {isSavingHomepageSeo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Homepage SEO
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="en">English Content</TabsTrigger>
                        <TabsTrigger value="ar">Arabic Content</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="en" className="pt-4">
                        <Form {...enForm}>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <FormField control={enForm.control} name="focusKeyword" render={({ field }) => (
                                                <FormItem><FormLabel>Focus Keyword</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <Controller control={enForm.control} name="relatedKeywords" render={({ field }) => (
                                                <FormItem><FormLabel>Related Keywords</FormLabel><FormControl><KeywordsInput value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={enForm.control} name="metaTitle" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Title ({field.value?.length || 0} / {MAX_TITLE_LENGTH})</FormLabel>
                                                <FormControl><Input {...field} /></FormControl><FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={enForm.control} name="metaDescription" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Description ({field.value?.length || 0} / {MAX_DESC_LENGTH})</FormLabel>
                                                <FormControl><Textarea rows={4} {...field} /></FormControl>
                                                {focusKeywordWarning && (
                                                    <Alert variant="destructive" className="mt-2 text-xs flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                                                        <AlertDescription>Warning: The meta description does not contain the focus keyword.</AlertDescription>
                                                    </Alert>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={enForm.control} name="ogTitle" render={({ field }) => (
                                            <FormItem><FormLabel>OpenGraph Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={enForm.control} name="ogDescription" render={({ field }) => (
                                            <FormItem><FormLabel>OpenGraph Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <div className="space-y-2">
                                            <FormLabel>OpenGraph Image</FormLabel>
                                            {ogImage.previewUrl ? (
                                                <div className="relative w-full aspect-video rounded-md border p-1 flex items-center justify-center bg-muted">
                                                <Image src={ogImage.previewUrl} alt="OpenGraph image preview" fill className="object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video rounded-md border flex items-center justify-center text-muted-foreground bg-muted">
                                                <p>No Image</p>
                                                </div>
                                            )}
                                            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                                <div className="flex flex-col items-center justify-center text-center p-4">
                                                <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Click to upload image</p>
                                                </div>
                                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                                            </label>
                                            <FormDescription>Recommended: 1200x630px image.</FormDescription>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                    
                    <TabsContent value="ar" className="pt-4">
                        <Form {...arForm}>
                            <form className="space-y-6" dir="rtl">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <FormField control={arForm.control} name="focusKeyword" render={({ field }) => (
                                                <FormItem><FormLabel>الكلمة المفتاحية الرئيسية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <Controller control={arForm.control} name="relatedKeywords" render={({ field }) => (
                                                <FormItem><FormLabel>الكلمات المفتاحية ذات الصلة</FormLabel><FormControl><KeywordsInput value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={arForm.control} name="metaTitle" render={({ field }) => (
                                            <FormItem><FormLabel>عنوان الميتا</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={arForm.control} name="metaDescription" render={({ field }) => (
                                            <FormItem><FormLabel>وصف الميتا</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={arForm.control} name="ogTitle" render={({ field }) => (
                                        <FormItem><FormLabel>عنوان OpenGraph (العربية)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={arForm.control} name="ogDescription" render={({ field }) => (
                                        <FormItem><FormLabel>وصف OpenGraph (العربية)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="lg:col-span-1">
                                         <div className="space-y-2">
                                            <FormLabel>صورة OpenGraph</FormLabel>
                                            {ogImage.previewUrl ? (
                                                <div className="relative w-full aspect-video rounded-md border p-1 flex items-center justify-center bg-muted">
                                                <Image src={ogImage.previewUrl} alt="OpenGraph image preview" fill className="object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video rounded-md border flex items-center justify-center text-muted-foreground bg-muted">
                                                <p>لا توجد صورة</p>
                                                </div>
                                            )}
                                            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                                <div className="flex flex-col items-center justify-center text-center p-4">
                                                <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">انقر لتحميل الصورة</p>
                                                </div>
                                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                                            </label>
                                            <FormDescription>مستحسن: صورة 1200x630 بكسل.</FormDescription>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <Accordion type="multiple" className="w-full space-y-4">
            <AccordionItem value="robots-editor" className="border rounded-lg">
                <AccordionTrigger className="text-xl font-semibold px-6">robots.txt Editor</AccordionTrigger>
                <AccordionContent className="p-6">
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>What is robots.txt?</AlertTitle>
                            <AlertDescription>
                            This file tells search engines which pages or files the crawler can or can’t request from your site.
                            </AlertDescription>
                        </Alert>
                        <Textarea
                            value={robotsContent}
                            onChange={(e) => setRobotsContent(e.target.value)}
                            placeholder={`User-agent: *\nAllow: /\n\nSitemap: ${typeof window !== 'undefined' ? window.location.origin : ''}/sitemap.xml`}
                            className="min-h-[300px] font-mono text-sm"
                        />
                        <div className="flex justify-end">
                            <Button onClick={() => handleSaveFile('robots')} disabled={isSavingFile === 'robots'}>
                                {isSavingFile === 'robots' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save robots.txt
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sitemap-editor" className="border rounded-lg">
                <AccordionTrigger className="text-xl font-semibold px-6">sitemap.xml Editor</AccordionTrigger>
                <AccordionContent className="p-6">
                     <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>What is sitemap.xml?</AlertTitle>
                            <AlertDescription>
                            This file helps search engines find, crawl, and index all of your website’s content. It lists all of your site's important pages.
                            </AlertDescription>
                        </Alert>
                        <Textarea
                            value={sitemapContent}
                            onChange={(e) => setSitemapContent(e.target.value)}
                            placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${typeof window !== 'undefined' ? window.location.origin : ''}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </url>\n</urlset>`}
                            className="min-h-[300px] font-mono text-sm"
                        />
                         <div className="flex justify-end">
                            <Button onClick={() => handleSaveFile('sitemap')} disabled={isSavingFile === 'sitemap'}>
                                {isSavingFile === 'sitemap' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save sitemap.xml
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
