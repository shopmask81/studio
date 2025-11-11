
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddressCard } from './address-card';
import { AddressForm } from './address-form';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/components/language/language-provider';

export function AddressList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addressesCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/addresses`);
  }, [user, firestore]);

  const { data: addresses, isLoading } = useCollection<Address>(addressesCollectionRef);

  const handleAddNew = () => {
    setAddressToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setAddressToEdit(address);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setAddressToEdit(null);
  };

  const handleSubmit = async (values: Omit<Address, 'id' | 'createdAt'>) => {
    if (!user || !firestore || !addressesCollectionRef) return;

    setIsProcessing(true);

    try {
        if (values.isDefault && addresses) {
            const batch = writeBatch(firestore);
            addresses.forEach(addr => {
                if (addr.isDefault && addr.id !== addressToEdit?.id) {
                    const addrRef = doc(firestore, `users/${user.uid}/addresses`, addr.id);
                    batch.update(addrRef, { isDefault: false });
                }
            });
            await batch.commit();
        }

        if (addressToEdit) {
            // Update existing address
            const addressRef = doc(firestore, `users/${user.uid}/addresses`, addressToEdit.id);
            await updateDoc(addressRef, values);
            toast({ title: t('address_updated_title'), description: t('address_updated_desc') });
        } else {
            // Add new address
            await addDoc(addressesCollectionRef, { ...values, createdAt: serverTimestamp() });
            toast({ title: t('address_added_title'), description: t('address_added_desc') });
        }
        setIsFormOpen(false);
        setAddressToEdit(null);
    } catch (error) {
        console.error("Error saving address:", error);
        toast({ variant: 'destructive', title: t('error_title'), description: t('failed_to_save_address') });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user || !firestore) return;
    setIsProcessing(true);
    try {
        const addressRef = doc(firestore, `users/${user.uid}/addresses`, addressId);
        await deleteDoc(addressRef);
        toast({ title: t('address_deleted_title'), description: t('address_deleted_desc') });
    } catch (error) {
        toast({ variant: 'destructive', title: t('error_title'), description: t('failed_to_delete_address') });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user || !firestore || !addresses) return;
    setIsProcessing(true);
    try {
        const batch = writeBatch(firestore);
        // Unset other defaults
        addresses.forEach(addr => {
            const addrRef = doc(firestore, `users/${user.uid}/addresses`, addr.id);
            if (addr.id === addressId) {
                batch.update(addrRef, { isDefault: true });
            } else if (addr.isDefault) {
                batch.update(addrRef, { isDefault: false });
            }
        });
        await batch.commit();
        toast({ title: t('default_address_set_title'), description: t('default_address_set_desc') });
    } catch (error) {
        toast({ variant: 'destructive', title: t('error_title'), description: t('failed_to_set_default') });
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isFormOpen) {
    return (
        <AddressForm
            addressToEdit={addressToEdit}
            isSubmitting={isProcessing}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    );
  }

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses?.map(addr => (
                <AddressCard 
                    key={addr.id} 
                    address={addr}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                    isProcessing={isProcessing}
                />
            ))}
        </div>
        
        {(!addresses || addresses.length === 0) && !isFormOpen && (
             <Card className="text-center border-2 border-dashed rounded-lg p-12">
                <h2 className="text-2xl font-semibold mb-2">{t('no_saved_addresses_title')}</h2>
                <p className="text-muted-foreground mb-6">{t('no_saved_addresses_desc')}</p>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('add_new_address')}
                </Button>
            </Card>
        )}

        {addresses && addresses.length > 0 && (
             <Button onClick={handleAddNew} className="mt-6">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('add_new_address')}
            </Button>
        )}
    </div>
  );
}
