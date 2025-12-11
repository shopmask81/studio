
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ROBOTS_PLACEHOLDER = `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`;

const SITEMAP_PLACEHOLDER = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
</urlset>`;

export default function SeoSettingsPage() {
  const [robotsContent, setRobotsContent] = useState('');
  const [sitemapContent, setSitemapContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRobots, setIsSavingRobots] = useState(false);
  const [isSavingSitemap, setIsSavingSitemap] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSeoFiles() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/seo');
        if (!response.ok) {
          throw new Error('Failed to fetch SEO settings');
        }
        const data = await response.json();
        setRobotsContent(data.robots);
        setSitemapContent(data.sitemap);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error loading SEO files',
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeoFiles();
  }, [toast]);

  const handleSave = async (fileType: 'robots' | 'sitemap', content: string) => {
    const setIsSaving = fileType === 'robots' ? setIsSavingRobots : setIsSavingSitemap;
    setIsSaving(true);
    
    // Basic Validation
    if (fileType === 'sitemap') {
        if (!content.includes('<urlset') || !content.includes('</urlset>')) {
            toast({ variant: 'destructive', title: 'Invalid Sitemap.xml', description: 'Content must be valid XML and contain a <urlset> tag.'});
            setIsSaving(false);
            return;
        }
    }
    if (fileType === 'robots') {
        if (!content.toLowerCase().includes('user-agent:')) {
            toast({ variant: 'destructive', title: 'Invalid robots.txt', description: 'Content must contain at least one "User-agent:" directive.'});
            setIsSaving(false);
            return;
        }
    }

    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save ${fileType}.txt`);
      }
      toast({
        title: 'Save Successful',
        description: `${fileType === 'robots' ? 'robots.txt' : 'sitemap.xml'} has been updated.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">SEO Settings</h1>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What are these files?</AlertTitle>
        <AlertDescription>
          <p><strong>robots.txt:</strong> Tells search engine crawlers which pages or files the crawler can or can't request from your site.</p>
          <p className="mt-1"><strong>sitemap.xml:</strong> Helps search engines better crawl your site by providing a map of all your important pages.</p>
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="robots" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="robots">robots.txt Editor</TabsTrigger>
            <TabsTrigger value="sitemap">sitemap.xml Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="robots">
            <Card>
              <CardHeader>
                <CardTitle>robots.txt</CardTitle>
                <CardDescription>Edit the content of your robots.txt file.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={robotsContent}
                  onChange={(e) => setRobotsContent(e.target.value)}
                  placeholder={ROBOTS_PLACEHOLDER}
                  className="min-h-[300px] font-mono text-sm"
                />
                <Button onClick={() => handleSave('robots', robotsContent)} disabled={isSavingRobots}>
                  {isSavingRobots && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save robots.txt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sitemap">
            <Card>
              <CardHeader>
                <CardTitle>sitemap.xml</CardTitle>
                <CardDescription>Edit the content of your sitemap.xml file.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={sitemapContent}
                  onChange={(e) => setSitemapContent(e.target.value)}
                  placeholder={SITEMAP_PLACEHOLDER}
                  className="min-h-[300px] font-mono text-sm"
                />
                 <Button onClick={() => handleSave('sitemap', sitemapContent)} disabled={isSavingSitemap}>
                  {isSavingSitemap && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save sitemap.xml
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
