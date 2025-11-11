
export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-8 text-center">Terms of Use</h1>
        <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-foreground">Introduction</h2>
          <p>
            These Terms of Use govern your use of the MaskShop website. By accessing or using our website, you agree to be bound by these terms and our Privacy Policy.
          </p>

          <h2 className="text-foreground">User Responsibilities</h2>
          <p>
            You agree to use our website only for lawful purposes. You are responsible for ensuring that any information you provide is accurate and that you have the right to provide it. You must be at least 18 years old to make a purchase on this site.
          </p>

          <h2 className="text-foreground">Prohibited Actions</h2>
          <p>
            You are prohibited from using the site to engage in any activity that is illegal, harmful, or fraudulent. You may not attempt to interfere with the proper working of the site, including hacking or introducing malicious code.
          </p>

          <h2 className="text-foreground">Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, and images, is the property of MaskShop or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works from any content without our express written permission.
          </p>

          <h2 className="text-foreground">Limitation of Liability</h2>
          <p>
            MaskShop will not be liable for any damages of any kind arising from the use of this site, including, but not limited to direct, indirect, incidental, punitive, and consequential damages. We do not guarantee that the site will be error-free or uninterrupted.
          </p>
        </div>
      </div>
    </div>
  );
}
