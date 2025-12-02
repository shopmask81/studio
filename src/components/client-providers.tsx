
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { LanguageProvider } from "@/components/language/language-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Providers } from "@/components/providers";
import { ModalProvider } from "@/components/modals/modal-provider";
import { Toaster } from "@/components/ui/toaster";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
          <LanguageProvider>
            <AuthProvider>
              <Providers>
                <ModalProvider>
                  {children}
                </ModalProvider>
                <Toaster />
              </Providers>
            </AuthProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
    );
}
