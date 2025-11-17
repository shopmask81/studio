
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Banner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
    addBanner, 
    updateBanner, 
    deleteBanner,
    updateBannerOrder
} from './services/banner-service';
import { BannerTable } from './components/banner-table';
import { BannerForm } from './components/banner-form';

export default function AdminBannersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'banners'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: banners, isLoading } = useCollection<Banner>(bannersQuery);

  const handleAddNew = () => {
    setBannerToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setBannerToEdit(banner);
    setIsFormOpen(true);
  };
  
  const handleOpenDeleteDialog = (banner: Banner) => {
    setBannerToDelete(banner);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setBannerToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleFormSubmit = async (values: Omit<Banner, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'imageUrl' | 'deleteUrl' | 'active'>, image: File | string) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      if (bannerToEdit) {
        await updateBanner(firestore, bannerToEdit.id, values, image);
        toast({ title: 'Banner Updated', description: `Banner "${values.title}" has been successfully updated.` });
      } else {
        const newOrder = banners ? banners.length : 0;
        await addBanner(firestore, values, image, newOrder);
        toast({ title: 'Banner Created', description: `Banner "${values.title}" has been successfully created.` });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !bannerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBanner(firestore, bannerToDelete);
      toast({ title: 'Banner Deleted', description: `Banner "${bannerToDelete.title}" has been deleted.` });
      closeDeleteDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleStatusChange = async (banner: Banner, active: boolean) => {
    if (!firestore) return;
    setIsUpdating(true);
    try {
        await updateBanner(firestore, banner.id, { active });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleOrderChange = async (reorderedBanners: Banner[]) => {
    if (!firestore) return;
    setIsUpdating(true);
    try {
        await updateBannerOrder(firestore, reorderedBanners);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Order Update Failed', description: error.message });
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Banners</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <BannerTable
          banners={banners || []}
          onEdit={handleEdit}
          onDelete={handleOpenDeleteDialog}
          onStatusChange={handleStatusChange}
          onOrderChange={handleOrderChange}
          isUpdating={isUpdating}
        />
      )}

      <BannerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        bannerToEdit={bannerToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              banner "{bannerToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
