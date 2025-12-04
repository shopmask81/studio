
'use client';
import { useTranslation } from "@/components/language/language-provider";
import { ClientOnly } from "@/components/layout/client-only";

export default function AboutPage() {
  const { t } = useTranslation();
  
  const p1 = t('about_p1');
  const p2 = t('about_p2');
  const p3 = t('about_p3');

  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-6 text-center" {...t('about_title')}>
            {t('about_title').text}
          </h1>
          <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
            <p dir={p1.dir}>{p1.text}</p>
            <p dir={p2.dir}>{p2.text}</p>
            <p dir={p3.dir}>{p3.text}</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}

    