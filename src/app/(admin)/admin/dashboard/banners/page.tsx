
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import type { Banner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, RefreshCw } from 'lucide-react';
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
    updateBannerOrder,
    updateBannerCache,
} from './services/banner-service';
import { BannerTable } from './components/banner-table';
import { BannerForm } from './components/banner-form';
import { getAllBanners } from '@/firebase/queries/getBanners';

export default function AdminBannersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  const fetchBanners = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const fetchedBanners = await getAllBanners(firestore);
      setBanners(fetchedBanners);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to load banners',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);


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
        await updateBanner(firestore, bannerToEdit.id, values, image, bannerToEdit.deleteUrl);
        toast({ title: 'Banner Updated', description: `Banner "${values.title}" has been successfully updated.` });
      } else {
        const newOrder = banners ? banners.length : 0;
        await addBanner(firestore, values, image, newOrder);
        toast({ title: 'Banner Created', description: `Banner "${values.title}" has been successfully created.` });
      }
      setIsFormOpen(false);
      fetchBanners(); // Refetch after submitting
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
      fetchBanners(); // Refetch after deleting
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
        // Optimistically update UI
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active } : b));
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleOrderChange = async (reorderedBanners: Banner[]) => {
    if (!firestore) return;
    setBanners(reorderedBanners); // Optimistically update UI
    setIsUpdating(true);
    try {
        await updateBannerOrder(firestore, reorderedBanners);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Order Update Failed', description: error.message });
        fetchBanners(); // Revert on failure
    } finally {
        setIsUpdating(false);
    }
  }

  const handleCacheUpdate = async () => {
    if (!firestore) return;
    setIsCaching(true);
    try {
        const count = await updateBannerCache(firestore);
        toast({
            title: 'Banner Cache Updated',
            description: `${count} banners have been cached for the public site.`
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Cache Update Failed', description: error.message });
    } finally {
        setIsCaching(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Banners</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCacheUpdate} disabled={isCaching}>
                {isCaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Update Cache
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Banner
            </Button>
        </div>
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
