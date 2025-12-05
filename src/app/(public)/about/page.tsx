'use client';
import { useTranslation } from "@/components/language/language-provider";
import { ClientOnly } from "@/components/layout/client-only";
import DOMPurify from 'isomorphic-dompurify';

export default function AboutPage() {
  const { t, language } = useTranslation();
  
  const title = language === 'ar' ? t('about_title_ar').text : t('about_title').text;
  const content = language === 'ar' ? t('about_p1_ar').text : t('about_p1').text;
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-6 text-center">
            {title}
          </h1>
          <div 
            className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </div>
    </ClientOnly>
  );
}
