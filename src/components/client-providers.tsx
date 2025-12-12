
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { LanguageProvider } from "@/components/language/language-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Providers } from "@/components/providers";
import { ModalProvider } from "@/components/modals/modal-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseErrorListener } from "./FirebaseErrorListener";

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
                {/* The listener is now inside the provider that initializes firebase */}
                <FirebaseErrorListener />
              </Providers>
            </AuthProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
    );
}
