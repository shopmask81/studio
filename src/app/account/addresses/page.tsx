
'use client';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AddressList } from '@/components/account/addresses/address-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/components/language/language-provider';

function AddressListSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    )
}

export default function AddressesPage() {
  const { t } = useTranslation();
  return (
    <ProtectedRoute>
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-headline mb-8" {...t('my_addresses')}>{t('my_addresses').text}</h1>
                 <Suspense fallback={<AddressListSkeleton />}>
                    <AddressList />
                </Suspense>
            </div>
        </div>
    </ProtectedRoute>
  );
}
