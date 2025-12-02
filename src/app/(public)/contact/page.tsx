
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import siteSettings from "@/data/siteSettings.json" assert { type: 'json' };

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-12">
          We’d love to hear from you. Whether you have questions about our products, feedback on our store, or partnership ideas — please feel free to reach out.
        </p>

        <div className="space-y-8">
            <div className="flex flex-col items-center">
                <Mail className="h-10 w-10 text-primary mb-3" />
                <h2 className="text-2xl font-semibold mb-1">Email Us</h2>
                <p className="text-muted-foreground mb-3">For general inquiries, support, and feedback.</p>
                <Button variant="link" asChild>
                    <a href={`mailto:${siteSettings.contactEmail}`} className="text-accent text-lg hover:underline">
                        {siteSettings.contactEmail}
                    </a>
                </Button>
            </div>
            
            <div className="flex flex-col items-center">
                <Phone className="h-10 w-10 text-primary mb-3" />
                <h2 className="text-2xl font-semibold mb-1">Call Us</h2>
                <p className="text-muted-foreground mb-3">For urgent matters, you can reach us by phone.</p>
                 <a href={`tel:${siteSettings.contactPhone}`} className="text-accent text-lg hover:underline">
                    {siteSettings.contactPhone}
                </a>
            </div>
        </div>
        
        <p className="text-muted-foreground mt-12">
          We typically respond to emails within 1-2 business days.
        </p>
      </div>
    </div>
  );
}
