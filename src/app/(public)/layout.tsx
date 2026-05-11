
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";
import { AffiliateTracker } from "@/components/affiliate/affiliate-tracker";
import { Suspense } from "react";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Suspense fallback={null}>
                <AffiliateTracker />
            </Suspense>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <WhatsAppFloatingButton />
        </div>
    );
}
