
'use client';

import { useTranslation } from "@/components/language/language-provider";

function EnglishTerms({ content }: { content: string }) {
  return (
    <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
  );
}

function ArabicTerms({ content }: { content: string }) {
    return (
        <div dir="rtl" className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6 text-right" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
    );
}

export default function TermsOfUsePage() {
  const { language, t } = useTranslation();
  
  const content = language === 'ar' ? t('terms_ar').text : t('terms_en').text;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">
                {language === 'ar' ? 'شروط وأحكام متجر MaskShop' : 'Terms & Conditions – MaskShop'}
            </h1>
        </header>
        
        {language === 'ar' ? <ArabicTerms content={content} /> : <EnglishTerms content={content} />}
      </div>
    </div>
  );
}

    