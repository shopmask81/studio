'use client';

import { useTranslation } from "@/components/language/language-provider";
import DOMPurify from 'isomorphic-dompurify';

export default function TermsOfUsePage() {
  const { language, t } = useTranslation();
  
  const title = language === 'ar' ? t('terms_title_ar').text : t('terms_title').text;
  const content = language === 'ar' ? t('terms_ar').text : t('terms_en').text;
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">
                {title}
            </h1>
        </header>
        
        <div 
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6" 
            dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />
      </div>
    </div>
  );
}
