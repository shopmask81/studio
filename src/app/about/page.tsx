
'use client';
import { useTranslation } from "@/components/language/language-provider";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-6 text-center" {...t('about_title')}>{t('about_title').text}</h1>
        <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
          <p {...t('about_p1')}>
            {t('about_p1').text}
          </p>
          <p {...t('about_p2')}>
            {t('about_p2').text}
          </p>
          <p {...t('about_p3')}>
            {t('about_p3').text}
          </p>
        </div>
      </div>
    </div>
  );
}
