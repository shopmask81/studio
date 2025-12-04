
'use client';

import { ClientOnly } from "@/components/layout/client-only";
import { useTranslation } from "@/components/language/language-provider";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  
  const intro = t('privacy_p_intro');
  const info = t('privacy_p_info');
  const use = t('privacy_p_use');
  const security = t('privacy_p_security');
  const cookies = t('privacy_p_cookies');
  const concerns = t('privacy_p_concerns_1');

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8 text-center" {...t('privacy_policy_title')}>{t('privacy_policy_title').text}</h1>
        <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
          <p {...t('last_updated')}>
            {t('last_updated').text}: <ClientOnly>{new Date().toLocaleDateString()}</ClientOnly>
          </p>

          <h2 className="text-foreground" {...t('privacy_h2_intro')}>{t('privacy_h2_intro').text}</h2>
          <p dir={intro.dir}>{intro.text}</p>

          <h2 className="text-foreground" {...t('privacy_h2_info')}>{t('privacy_h2_info').text}</h2>
          <p dir={info.dir}>{info.text}</p>

          <h2 className="text-foreground" {...t('privacy_h2_use')}>{t('privacy_h2_use').text}</h2>
          <p dir={use.dir}>{use.text}</p>

          <h2 className="text-foreground" {...t('privacy_h2_security')}>{t('privacy_h2_security').text}</h2>
          <p dir={security.dir}>{security.text}</p>

          <h2 className="text-foreground" {...t('privacy_h2_cookies')}>{t('privacy_h2_cookies').text}</h2>
          <p dir={cookies.dir}>{cookies.text}</p>

          <h2 className="text-foreground" {...t('privacy_h2_concerns')}>{t('privacy_h2_concerns').text}</h2>
          <p dir={concerns.dir}>
            {concerns.text}{" "}
            <Link href="/contact" className="text-primary hover:underline">
              {t('privacy_p_concerns_link').text}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

    