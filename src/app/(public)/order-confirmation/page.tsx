
'use client';

import Link from 'next/link';
import { CheckCircle, UserCheck, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/components/language/language-provider';

export default function OrderConfirmationPage() {
  const { language } = useTranslation();

  const t = {
    en: {
      thankYou: "Thank you!",
      received: "Your order has been received successfully. We will contact you within 24 hours via email, WhatsApp, or a phone call.",
      stepsTitle: "How we process your order",
      steps: [
        "Review your information",
        "Prepare your order",
        "Ship your package"
      ],
      continueShopping: "Continue Shopping"
    },
    ar: {
      thankYou: "شكراً لك!",
      received: "لقد تم استلام طلبك بنجاح، سنتواصل معك داخل أجل أقصاه 24 ساعة إما عن طريق الإيميل أو الواتساب أو مكالمة هاتفية.",
      stepsTitle: "الخطوات التي نتبعها لمعالجة طلبك",
      steps: [
        "مراجعة بياناتك",
        "تجهيز طلبك",
        "شحن الطرد"
      ],
      continueShopping: "مواصلة التسوق"
    }
  };

  const content = t[language];
  const pageDirection = language === 'ar' ? 'rtl' : 'ltr';

  const stepIcons = [
    <UserCheck key={1} className="h-8 w-8 text-primary" />,
    <Package key={2} className="h-8 w-8 text-primary" />,
    <Truck key={3} className="h-8 w-8 text-primary" />
  ];

  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-15rem)]">
      <div className="w-full max-w-3xl" dir={pageDirection}>
        <Card className="text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline mt-4">
              {content.thankYou}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {content.received}
            </p>
            <Button asChild size="lg">
              <Link href="/">{content.continueShopping}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-8 shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-center">{content.stepsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-center">
                    {content.steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center gap-3 flex-1">
                                <div className="bg-muted rounded-full p-4">
                                    {stepIcons[index]}
                                </div>
                                <h3 className="font-semibold">{step}</h3>
                            </div>
                            {index < content.steps.length - 1 && (
                                <Separator className="hidden md:block h-20 w-[1px]" orientation="vertical" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
