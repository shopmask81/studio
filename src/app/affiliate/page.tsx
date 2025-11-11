import { ProtectedRoute } from "@/components/auth/protected-route";
import { AffiliateTool } from "@/components/affiliate/affiliate-tool";

export default function AffiliatePage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-headline mb-2">Affiliate Program</h1>
                        <p className="text-muted-foreground">Generate your unique affiliate links to share and earn.</p>
                    </div>
                    <AffiliateTool />
                </div>
            </div>
        </ProtectedRoute>
    );
}
