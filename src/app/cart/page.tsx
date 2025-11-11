'use client';
import { CartContents } from "@/components/cart/cart-contents";
import { useTranslation } from "@/components/language/language-provider";

export default function CartPage() {
    const { t } = useTranslation();
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-headline mb-8" {...t('shopping_cart')}>{t('shopping_cart').text}</h1>
            <CartContents />
        </div>
    );
}
