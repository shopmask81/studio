
'use client';

import { ClientOnly } from "@/components/layout/client-only";
import { useTranslation } from "@/components/language/language-provider";

export default function PrivacyPolicyPage() {
  const { language, t } = useTranslation();
  
  const content = language === 'ar' ? t('privacy_policy_content_ar').text : t('privacy_policy_content').text;

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8 text-center" {...t('privacy_policy_title')}>{t('privacy_policy_title').text}</h1>
        <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
            <p {...t('last_updated')}>
                {t('last_updated').text}: <ClientOnly>{new Date().toLocaleDateString()}</ClientOnly>
            </p>
            <div dir={language === 'ar' ? 'rtl' : 'ltr'} dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        </div>
      </div>
    </div>
  );
}
