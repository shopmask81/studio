
'use client';

import { ClientOnly } from "@/components/layout/client-only";
import { useTranslation } from "@/components/language/language-provider";

function EnglishTerms() {
  return (
    <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
        <p>Last Updated: <ClientOnly>{new Date().toLocaleDateString()}</ClientOnly></p>

        <h2 className="text-foreground">1. Definitions</h2>
        <ul className="list-disc space-y-2">
            <li><strong>“The Store” (we/us):</strong> refers to MaskShop, an online store specializing in handmade, vintage, and artisanal Egyptian products.</li>
            <li><strong>“Products”:</strong> handmade crafts, vintage items, and artisanal goods available on the website.</li>
            <li><strong>“User” (you):</strong> anyone visiting, browsing, creating an account, or purchasing from the store.</li>
        </ul>

        <h2 className="text-foreground">2. Conditions of Use & Order Acceptance</h2>
        <ul className="list-disc space-y-2">
            <li>Users must be at least 18 years old.</li>
            <li>You are responsible for your account credentials.</li>
            <li>Handmade products may vary slightly from the images; this is normal and not considered a defect.</li>
            <li>Orders are only confirmed after receiving an official confirmation email.</li>
        </ul>
        
        <h2 className="text-foreground">3. Prices & Payment</h2>
        <ul className="list-disc space-y-2">
            <li>All prices are displayed in AED.</li>
            <li>Prices include VAT (when applicable). Shipping fees may apply.</li>
            <li>Accepted payment methods: Visa, Mastercard, Apple Pay, Cash on Delivery (if available).</li>
            <li>A formal invoice will be provided for every completed purchase.</li>
        </ul>

        <h2 className="text-foreground">4. Shipping & Delivery</h2>
        <ul className="list-disc space-y-2">
            <li>Delivery is available within the UAE (or additional countries if added later).</li>
            <li>Handmade products may require additional preparation time.</li>
            <li>You must provide a correct delivery address and active phone number.</li>
        </ul>

        <h2 className="text-foreground">5. Return & Exchange Policy</h2>
        <ul className="list-disc space-y-2">
            <li>You may return products within 14 days if unused and in original packaging.</li>
            <li>Customized handmade items cannot be returned unless defective.</li>
            <li>If the product arrives damaged, we cover return shipping and offer replacement or refund.</li>
            <li>Refunds are processed within a number of days after inspection.</li>
        </ul>

        <h2 className="text-foreground">6. Intellectual Property</h2>
        <ul className="list-disc space-y-2">
            <li>All website content is owned by MaskShop and protected by UAE law.</li>
            <li>Handmade product designs may be protected by the original artisans. Reproduction or resale without consent is prohibited.</li>
        </ul>

        <h2 className="text-foreground">7. Privacy Policy</h2>
        <ul className="list-disc space-y-2">
            <li>We collect personal data to process orders and improve services.</li>
            <li>We never share data with third parties without explicit consent.</li>
            <li>Payments are handled through secure and encrypted gateways.</li>
        </ul>

        <h2 className="text-foreground">8. Dispute Resolution</h2>
        <ul className="list-disc space-y-2">
            <li>Complaints may be submitted via email.</li>
            <li>UAE e-commerce and consumer protection laws apply to all disputes.</li>
        </ul>
    </div>
  );
}

function ArabicTerms() {
    return (
        <div dir="rtl" className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6 text-right">
            <p>آخر تحديث: <ClientOnly>{new Date().toLocaleDateString('ar-EG')}</ClientOnly></p>

            <h2 className="text-foreground">1. التعريفات</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li><strong>المتجر (نحن/لنا):</strong> يشير إلى MaskShop، وهو متجر إلكتروني يعمل في بيع المنتجات اليدوية القديمة والـVintage والـHandmade.</li>
                <li><strong>المنتجات:</strong> هي المنتجات اليدوية التقليدية المصرية (Handmade) والمنتجات العتيقة والفينتج المعروضة عبر المتجر.</li>
                <li><strong>المستخدم (أنت):</strong> هو أي شخص يزور أو يستخدم أو يسجل حساباً أو يشتري المنتجات من المتجر.</li>
            </ul>

            <h2 className="text-foreground">2. شروط الاستخدام وقبول الطلبات</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>يجب ألا يقل عمر المستخدم عن 18 عاماً.</li>
                <li>أنت مسؤول عن بيانات حسابك وكلمة المرور.</li>
                <li>المنتجات يدوية الصنع وقد تحتوي على اختلافات بسيطة عن الصور، وهذا لا يُعتبر عيباً.</li>
                <li>الطلب يصبح مؤكداً فقط بعد إرسال تأكيد رسمي عبر البريد الإلكتروني.</li>
            </ul>

            <h2 className="text-foreground">3. الأسعار والدفع</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>الأسعار بالدرهم الإماراتي (AED).</li>
                <li>الأسعار تشمل الضريبة (إن وجدت) ويضاف إليها الشحن.</li>
                <li>طرق الدفع: بطاقة فيزا / ماستركارد / Apple Pay / الدفع عند الاستلام (إن توفر).</li>
                <li>يتم إصدار فاتورة رسمية بعد كل عملية شراء.</li>
            </ul>

            <h2 className="text-foreground">4. الشحن والتوصيل</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>التوصيل داخل دولة الإمارات العربية المتحدة (أو حسب التوسّع لاحقاً).</li>
                <li>المنتجات اليدوية قد تحتاج وقت تجهيز إضافي.</li>
                <li>يجب توفير عنوان صحيح ورقم هاتف فعال.</li>
            </ul>

            <h2 className="text-foreground">5. سياسة الإرجاع والاستبدال</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>يمكنك إرجاع المنتج خلال 14 يومًا إذا كان غير مستخدم وفي حالته الأصلية.</li>
                <li>لا يمكن إرجاع المنتجات المصنوعة حسب الطلب، إلا إذا كانت معيبة.</li>
                <li>عند وجود عيب، نتحمل تكاليف الإرجاع والاستبدال.</li>
                <li>استرداد المبلغ يتم خلال عدد من الأيام بعد فحص المنتج.</li>
            </ul>

            <h2 className="text-foreground">6. الملكية الفكرية</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>جميع محتويات الموقع ملك لـ MaskShop ومحميّة قانونياً.</li>
                <li>تصاميم المنتجات اليدوية قد تكون محمية بحقوق تخص الحرفيين. يمنع نسخها أو إعادة بيعها دون إذن.</li>
            </ul>

            <h2 className="text-foreground">7. سياسة الخصوصية</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>نجمع بيانات المستخدم بهدف معالجة الطلبات وتحسين الخدمات.</li>
                <li>لن نشارك البيانات مع جهات خارجية دون موافقة المستخدم.</li>
                <li>الدفع يتم عبر بوابات دفع آمنة.</li>
            </ul>

            <h2 className="text-foreground">8. التعامل مع النزاعات</h2>
            <ul className="list-disc space-y-2 mr-6">
                <li>يمكن تقديم الشكاوى عبر البريد الإلكتروني.</li>
                <li>تُطبق قوانين دولة الإمارات العربية المتحدة المتعلقة بالتجارة الإلكترونية وحماية المستهلك.</li>
            </ul>
        </div>
    );
}


export default function TermsOfUsePage() {
  const { language } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">
                {language === 'ar' ? 'شروط وأحكام متجر MaskShop' : 'Terms & Conditions – MaskShop'}
            </h1>
        </header>
        
        {language === 'ar' ? <ArabicTerms /> : <EnglishTerms />}

      </div>
    </div>
  );
}
