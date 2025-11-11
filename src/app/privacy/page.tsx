
import { ClientOnly } from "@/components/layout/client-only";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8 text-center">Privacy Policy</h1>
        <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
          <p>Last Updated: <ClientOnly>{new Date().toLocaleDateString()}</ClientOnly></p>

          <h2 className="text-foreground">Introduction</h2>
          <p>
            Welcome to MaskShop. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2 className="text-foreground">Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email address, shipping address, and payment information when you place an order. We also collect non-personal information, such as browser type and pages visited, to improve our services.
          </p>

          <h2 className="text-foreground">How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, communicate with you about your purchases, improve our website and services, and for marketing purposes, provided we have your consent.
          </p>

          <h2 className="text-foreground">Data Protection and Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
          </p>

          <h2 className="text-foreground">Cookies and Tracking</h2>
          <p>
            Our website uses cookies to enhance your experience. Cookies are small files that a site or its service provider transfers to your computer's hard drive through your Web browser that enables the site's or service provider's systems to recognize your browser and capture and remember certain information.
          </p>

          <h2 className="text-foreground">Contact for Privacy Concerns</h2>
          <p>
            If you have any questions or concerns about our privacy policy or data handling practices, please contact us at <a href="mailto:privacy@maskshop.com" className="text-primary hover:underline">privacy@maskshop.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
