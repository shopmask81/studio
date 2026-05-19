
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Affiliate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { AffiliateTable } from './components/affiliate-table';
import { AffiliateForm } from './components/affiliate-form';
import { addAffiliate, updateAffiliate, deleteAffiliate } from './services/affiliate-service';

export default function AdminAffiliatesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [affiliateToEdit, setAffiliateToEdit] = useState<Affiliate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const affiliatesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'affiliates'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allAffiliates, isLoading } = useCollection<Affiliate>(affiliatesQuery);

  const filteredAffiliates = allAffiliates?.filter(aff => 
    aff.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    aff.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    aff.code.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  ) || [];

  const handleAddNew = () => {
    setAffiliateToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (affiliate: Affiliate) => {
    setAffiliateToEdit(affiliate);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (!firestore) return;
    setIsSubmitting(true);

    // Convert percentage (e.g., 10) back to decimal (0.1) for database storage
    const submissionValues = {
        ...values,
        commissionRate: values.commissionRate / 100
    };

    try {
      if (affiliateToEdit) {
        await updateAffiliate(firestore, affiliateToEdit.id, submissionValues);
        toast({ title: 'Affiliate Updated', description: `Affiliate ${values.name} has been updated.` });
      } else {
        await addAffiliate(firestore, submissionValues);
        toast({ title: 'Affiliate Created', description: `New affiliate ${values.name} has been added.` });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (affiliate: Affiliate) => {
    if (!firestore) return;
    try {
      await deleteAffiliate(firestore, affiliate);
      toast({ title: 'Affiliate Deleted', description: `Affiliate ${affiliate.name} has been removed.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };

  const handleStatusChange = async (affiliate: Affiliate, status: Affiliate['status']) => {
    if (!firestore) return;
    try {
        await updateAffiliate(firestore, affiliate.id, { status });
        toast({ title: 'Status Updated', description: `Affiliate status set to ${status}.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Affiliates</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Affiliate
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <AffiliateTable
          affiliates={filteredAffiliates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <AffiliateForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        affiliateToEdit={affiliateToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
