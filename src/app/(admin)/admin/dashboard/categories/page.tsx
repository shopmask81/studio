
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { CategoryTable } from './components/category-table';
import { CategoryFormDialog } from './components/category-form';
import {
  addCategory as addCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  updateCategoryCache,
} from './services/category-service';
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
} from "@/components/ui/alert-dialog"

export default function AdminCategoriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isCaching, setIsCaching] = useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'));
  }, [firestore]);

  const { data: allCategories, isLoading } = useCollection<Category>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (!query) return allCategories;

    return allCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }, [allCategories, debouncedSearchQuery]);

  const handleAddNew = () => {
    setCategoryToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsFormOpen(true);
  };
  
  const handleOpenDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCategoryToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleFormSubmit = async (name: string) => {
    if (!firestore || !allCategories) return;
    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await updateCategoryService(firestore, categoryToEdit.id, name, allCategories);
        toast({ title: 'Category Updated', description: `Category "${name}" has been successfully updated.` });
      } else {
        await addCategoryService(firestore, name, allCategories);
        toast({ title: 'Category Created', description: `Category "${name}" has been successfully created.` });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategoryService(firestore, categoryToDelete.id);
      toast({ title: 'Category Deleted', description: `Category "${categoryToDelete.name}" has been deleted.` });
      closeDeleteDialog();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleCacheUpdate = async () => {
    if (!firestore) return;
    setIsCaching(true);
    try {
        const count = await updateCategoryCache(firestore);
        toast({
            title: 'Category Cache Updated',
            description: `${count} categories have been cached.`
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
        <h1 className="text-3xl font-bold">Categories</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCacheUpdate} disabled={isCaching}>
                {isCaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Update Cache
            </Button>
            <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Category
            </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search categories by name or slug..."
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
        <CategoryTable
          categories={filteredCategories}
          onEdit={handleEdit}
          onDelete={handleOpenDeleteDialog}
        />
      )}

      <CategoryFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        categoryToEdit={categoryToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category "{categoryToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
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
