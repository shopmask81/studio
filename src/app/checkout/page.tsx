
'use client';
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { useTranslation } from "@/components/language/language-provider";

export default function CheckoutPage() {
    const { t } = useTranslation();
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-headline mb-8" {...t('checkout_title')}>{t('checkout_title').text}</h1>
            <CheckoutForm />
        </div>
    );
}
