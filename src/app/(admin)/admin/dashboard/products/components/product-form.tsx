
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category, VariantDetail } from '@/lib/types';
import { Loader2, Upload, X, Trash2, PlusCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UploadedImage = {
  id: string;
  url: string;
  deleteUrl: string;
};

// Zod schema for a single variant detail
const variantDetailSchema = z.object({
  id: z.string(),
  color: z.string(),
  size: z.string(),
  price: z.coerce.number().positive('Price must be > 0'),
  discountPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, 'Stock required'),
  sku: z.string().optional(),
});

// Zod schema for a single option (color or size)
const optionSchema = z.object({
  value: z.string().min(1, 'Option cannot be empty'),
});

const formSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  description: z.string().min(10, 'Description is required.'),
  name_ar: z.string().optional(),
  description_ar: z.string().optional(),
  price: z.coerce.number(),
  discountPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int(),
  category: z.string().min(1, 'Category is required.'),
  sku: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  
  // Variants structure
  variantsEnabled: z.boolean().default(false),
  variantOptions: z.object({
    colors: z.array(optionSchema),
    sizes: z.array(optionSchema),
  }),
  variants: z.array(variantDetailSchema),
}).superRefine((data, ctx) => {
  if (data.variantsEnabled) {
    if (data.variantOptions.colors.length === 0 && data.variantOptions.sizes.length === 0) {
      // It's okay if no options are added yet, but no variants will be generated.
      return;
    }
    if (data.variants.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['variantsEnabled'],
            message: "You must add at least one Color or Size and generate variants.",
        });
    }
  } else {
    if (data.price <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Price must be positive.', path: ['price'] });
    }
    if (data.stock < 0) {
      ctx.addIssue({ code: 'custom', message: 'Stock cannot be negative.', path: ['stock'] });
    }
  }
});


type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  productToEdit?: Product;
}

// Helper to generate a unique ID for variants
const createVariantId = (color: string, size: string) => `${color}-${size}`.toLowerCase().replace(/\s+/g, '-');


async function uploadToImgBB(file: File): Promise<Omit<UploadedImage, 'id'>> {
    const apiKey = '518d3cdcaedf3c5ade143a41de38c554';
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Image upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.data || !result.data.url || !result.data.delete_url) {
        throw new Error('Invalid response from image upload service. Missing url or delete_url.');
    }
    
    return { url: result.data.url, deleteUrl: result.data.delete_url };
}

async function deleteFromImgBB(deleteUrl: string): Promise<void> {
  const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deleteUrl }),
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image via server proxy.');
  }
}


export function ProductForm({ productToEdit }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name'));
  }, [firestore]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  const defaultValues: ProductFormValues = {
    name: productToEdit?.name || '',
    description: productToEdit?.description || '',
    name_ar: productToEdit?.name_ar || '',
    description_ar: productToEdit?.description_ar || '',
    price: productToEdit?.price ?? 0,
    stock: productToEdit?.stock ?? 0,
    discountPrice: productToEdit?.discountPrice ?? undefined,
    category: productToEdit?.category || '',
    sku: productToEdit?.sku ?? '',
    active: productToEdit?.active ?? true,
    featured: productToEdit?.featured ?? false,
    variantsEnabled: productToEdit?.variantsEnabled ?? false,
    variantOptions: {
      colors: (productToEdit?.variantOptions?.colors || []).map(c => ({ value: c })),
      sizes: (productToEdit?.variantOptions?.sizes || []).map(s => ({ value: s })),
    },
    variants: productToEdit?.variants || [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control: form.control,
    name: "variantOptions.colors",
  });
  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control: form.control,
    name: "variantOptions.sizes",
  });
  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const watchedColors = useWatch({ control: form.control, name: 'variantOptions.colors' });
  const watchedSizes = useWatch({ control: form.control, name: 'variantOptions.sizes' });
  const variantsEnabled = useWatch({ control: form.control, name: 'variantsEnabled' });

  // This effect will regenerate the variants table whenever colors or sizes change.
  useEffect(() => {
    if (!variantsEnabled) return;

    const colors = watchedColors.map(c => c.value).filter(Boolean);
    const sizes = watchedSizes.map(s => s.value).filter(Boolean);
    
    if (colors.length === 0 && sizes.length === 0) {
      replaceVariants([]);
      return;
    }

    // Ensure at least one array has items to avoid empty generation
    const colorOptions = colors.length > 0 ? colors : [''];
    const sizeOptions = sizes.length > 0 ? sizes : [''];

    const newVariants = colorOptions.flatMap(color =>
      sizeOptions.map(size => {
        const id = createVariantId(color, size);
        const existingVariant = variantFields.find(v => v.id === id);
        return {
          id,
          color,
          size,
          price: existingVariant?.price || 0,
          discountPrice: existingVariant?.discountPrice || undefined,
          stock: existingVariant?.stock || 0,
          sku: existingVariant?.sku || '',
        };
      })
    );
    
    replaceVariants(newVariants);
  }, [watchedColors, watchedSizes, variantsEnabled, replaceVariants, variantFields]);
  

  const handleBulkApply = (field: 'price' | 'discountPrice' | 'stock', value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return;
  
    const currentVariants = form.getValues('variants');
    const updatedVariants = currentVariants.map(variant => ({
      ...variant,
      [field]: numericValue,
    }));
    form.setValue('variants', updatedVariants, { shouldDirty: true });
  };


  useEffect(() => {
    if (productToEdit) {
      const mainImageUrl = productToEdit.mainImage;
      const otherImageUrls = productToEdit.images || [];
      const loadedImages: UploadedImage[] = [mainImageUrl, ...otherImageUrls]
        .filter(Boolean)
        .map(url => ({
          id: `${url}-${Math.random().toString(36).substring(2, 9)}`,
          url,
          deleteUrl: `placeholder-delete-url-for-${url}` 
        }));
      
      setUploadedImages(loadedImages);
      
      const mainIdx = loadedImages.findIndex(img => img.url === mainImageUrl);
      setMainImageIndex(mainIdx !== -1 ? mainIdx : (loadedImages.length > 0 ? 0 : null));
    }
  }, [productToEdit]);
  
  useEffect(() => {
    return () => {
      localPreviews.forEach(url => URL.revokeObjectURL(url));
    }
  }, [localPreviews]);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const uniqueNewFiles = newFiles.filter(file => !selectedFiles.some(f => f.name === file.name && f.size === file.size));
      
      const wasEmpty = selectedFiles.length === 0 && uploadedImages.length === 0;

      setSelectedFiles(prev => [...prev, ...uniqueNewFiles]);
      setLocalPreviews(prev => [...prev, ...uniqueNewFiles.map(file => URL.createObjectURL(file))]);
      
      if (wasEmpty && uniqueNewFiles.length > 0) {
        setMainImageIndex(0);
      }
    }
  };
  
  const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleFileSelect(event.dataTransfer.files);
  };

  const removeLocalPreview = (indexToRemove: number) => {
      const removedUrl = localPreviews[indexToRemove];
      URL.revokeObjectURL(removedUrl);

      setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
      setLocalPreviews(prev => prev.filter((_, index) => index !== indexToRemove));

      if (mainImageIndex !== null) {
        if (mainImageIndex === indexToRemove) {
          const newTotalImages = selectedFiles.length - 1 + uploadedImages.length;
          setMainImageIndex(newTotalImages > 0 ? 0 : null);
        } else if (mainImageIndex > indexToRemove) {
          setMainImageIndex(mainImageIndex - 1);
        }
      }
  };
  
  const removeUploadedImage = async (idToRemove: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === idToRemove);
    if (!imageToRemove) return;
  
    if (imageToRemove.deleteUrl.startsWith('placeholder')) {
        toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This image was saved without a deletion link.' });
        return;
    }

    setDeletingUrl(imageToRemove.url);
    try {
      await deleteFromImgBB(imageToRemove.deleteUrl);
  
      setUploadedImages(prevImages => {
        const urlIndex = prevImages.findIndex(img => img.id === idToRemove);
        const newImages = prevImages.filter(img => img.id !== idToRemove);
  
        if (mainImageIndex !== null) {
          const totalLocalImages = selectedFiles.length;
          const uploadedIndex = urlIndex + totalLocalImages;

          if (mainImageIndex === uploadedIndex) {
            const newTotalImages = totalLocalImages + newImages.length;
            setMainImageIndex(newTotalImages > 0 ? 0 : null);
          } else if (mainImageIndex > uploadedIndex) {
            setMainImageIndex(prev => (prev !== null ? prev - 1 : null));
          }
        }
  
        return newImages;
      });
      
      toast({ title: 'Image Deleted', description: 'The image has been removed from the server.' });
  
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: (error as Error).message || 'Could not delete the image from the server.' });
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No new images selected', description: 'Please select images to upload first.'});
      return;
    }
    if (mainImageIndex === null || mainImageIndex >= selectedFiles.length) {
      toast({ variant: 'destructive', title: 'Main image not selected', description: 'Please select a main image from the "Selected for Upload" section before uploading.'});
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing...');
    const newUploadedImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadStatus(`Uploading image ${i + 1} of ${selectedFiles.length}...`);
        const newUpload = await uploadToImgBB(file);
        newUploadedImages.push({
            id: `${newUpload.url}-${Math.random().toString(36).substring(2, 9)}`,
            ...newUpload,
        });
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      setUploadedImages(prev => {
        const existingUrls = new Set(prev.map(img => img.url));
        const trulyNewImages = newUploadedImages.filter(img => !existingUrls.has(img.url));
        return [...prev, ...trulyNewImages];
      });
      
      if (mainImageIndex !== null) {
          setMainImageIndex(mainImageIndex + uploadedImages.length);
      }
      
      setSelectedFiles([]);
      localPreviews.forEach(url => URL.revokeObjectURL(url)); 
      setLocalPreviews([]); 

      setUploadStatus('Upload Complete!');
      toast({ title: 'Upload Successful', description: `${newUploadedImages.length} images have been uploaded.`});
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message || 'There was a problem uploading your images.'});
      setUploadStatus('Upload Failed!');
    } finally {
      setTimeout(() => setIsUploading(false), 2000);
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    
    let _selectedFiles = [...selectedFiles];
    let _localPreviews = [...localPreviews];

    const draggedFile = _selectedFiles.splice(dragItem.current, 1)[0];
    const draggedPreview = _localPreviews.splice(dragItem.current, 1)[0];

    _selectedFiles.splice(dragOverItem.current, 0, draggedFile);
    _localPreviews.splice(dragOverItem.current, 0, draggedPreview);
    
    if (mainImageIndex !== null) {
      if (dragItem.current === mainImageIndex) {
          setMainImageIndex(dragOverItem.current);
      } else {
          if (dragItem.current < mainImageIndex && dragOverItem.current >= mainImageIndex) {
            setMainImageIndex(mainImageIndex - 1);
          } else if (dragItem.current > mainImageIndex && dragOverItem.current <= mainImageIndex) {
            setMainImageIndex(mainImageIndex + 1);
          }
      }
    }
    
    dragItem.current = null;
    dragOverItem.current = null;

    setSelectedFiles(_selectedFiles);
    setLocalPreviews(_localPreviews);
  };


  const onSubmit = async (data: ProductFormValues) => {
    if (!firestore) return;
    
    if (uploadedImages.length === 0) {
      toast({ variant: 'destructive', title: 'No images available', description: 'You must upload at least one image.'});
      return;
    }

    if (mainImageIndex === null || mainImageIndex >= uploadedImages.length + selectedFiles.length) {
        toast({ variant: 'destructive', title: 'Main image required', description: 'Please select a main image for the product.'});
        return;
    }
    
    if (selectedFiles.length > 0) {
      toast({ variant: 'destructive', title: 'Un-uploaded images', description: `You have ${selectedFiles.length} selected images that have not been uploaded. Please upload them before saving.`});
      return;
    }

    setIsSubmitting(true);
    
    try {
        const mainImage = uploadedImages[mainImageIndex].url;
        const additionalImages = uploadedImages.filter((_, index) => index !== mainImageIndex).map(img => img.url);

        let productData: Partial<Product> = {
            name: data.name,
            description: data.description,
            name_ar: data.name_ar,
            description_ar: data.description_ar,
            category: data.category,
            active: data.active,
            featured: data.featured,
            mainImage: mainImage,
            images: additionalImages,
            variantsEnabled: data.variantsEnabled,
        };

        if (data.variantsEnabled) {
            productData = {
                ...productData,
                variants: data.variants,
                variantOptions: {
                    colors: data.variantOptions.colors.map(c => c.value).filter(Boolean),
                    sizes: data.variantOptions.sizes.map(s => s.value).filter(Boolean),
                },
                price: 0, // Base price is not used
                stock: 0, // Base stock is not used
            };
        } else {
            productData = {
                ...productData,
                price: data.price,
                discountPrice: data.discountPrice,
                stock: data.stock,
                sku: data.sku,
                variants: [],
                variantOptions: { colors: [], sizes: [] },
            }
        }

        if (productToEdit) {
            const productRef = doc(firestore, 'products', productToEdit.id);
            const dataToUpdate = { ...productData, updatedAt: serverTimestamp() };
            await updateDoc(productRef, dataToUpdate);
            toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
            router.push('/admin/dashboard/products');
            router.refresh();
        } else {
            const collectionRef = collection(firestore, 'products');
            const dataToCreate = { ...productData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            await addDoc(collectionRef, dataToCreate);
            toast({ title: 'Product Created', description: 'The new product has been added.' });
            router.push('/admin/dashboard/products');
            router.refresh();
        }
    } catch (error) {
        console.error('Error in onSubmit logic:', error);
        if ((error as any)?.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: productToEdit ? `products/${productToEdit.id}` : 'products',
                operation: productToEdit ? 'update' : 'create',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to perform this action.' });
        } else {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred while saving the product.' });
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  Provide the main details for your product in English and Arabic.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name (English)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Venetian Gold Mask" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name (Arabic)</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: قناع فينيسي ذهبي" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (English)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the product in English..."
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div>
                    <FormField
                      control={form.control}
                      name="description_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Arabic)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="صف المنتج باللغة العربية..."
                              rows={5}
                              dir="rtl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>Drag and drop images, select a main one, reorder them, then upload.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <label 
                            className="flex flex-col items-center justify-center w-full min-h-[150px] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground">Drag & Drop images here or click to select</p>
                            </div>
                            <input type="file" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} multiple accept="image/*" />
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">Recommended size: 1200×1200 px — Square images work best (1:1 ratio). Max file size: 5 MB.</p>


                        {localPreviews.length > 0 && (
                            <div className="mt-4">
                               <h3 className="font-medium text-sm mb-2">Selected for Upload ({localPreviews.length}) - Drag to reorder</h3>
                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                   {localPreviews.map((src, index) => (
                                       <div 
                                         key={src} 
                                         className="relative group aspect-square cursor-grab"
                                         draggable
                                         onDragStart={() => dragItem.current = index}
                                         onDragEnter={() => dragOverItem.current = index}
                                         onDragEnd={handleDragSort}
                                         onDragOver={(e) => e.preventDefault()}
                                        >
                                           <Image src={src} alt={`Preview ${index}`} fill className={cn("object-cover rounded-md border-2", mainImageIndex === index ? "border-primary" : "border-transparent")}/>
                                           <Button
                                               type="button"
                                               variant="destructive"
                                               size="icon"
                                               className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                               onClick={() => removeLocalPreview(index)}
                                           >
                                               <X className="h-4 w-4" />
                                           </Button>
                                            {mainImageIndex === index ? (
                                                <Badge className="absolute bottom-1 left-1 z-10">Main</Badge>
                                           ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="absolute bottom-1 left-1 h-auto px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={() => setMainImageIndex(index)}
                                                >
                                                    Set as main
                                                </Button>
                                           )}
                                       </div>
                                   ))}
                               </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-4">
                            <Button type="button" onClick={handleUploadImages} disabled={isUploading || selectedFiles.length === 0 || mainImageIndex === null || mainImageIndex >= selectedFiles.length}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
                            </Button>
                            {isUploading && (
                                <div className="flex-grow space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">{uploadStatus}</p>
                                    <Progress value={uploadProgress} className="w-full h-2" />
                                </div>
                            )}
                        </div>

                    </div>
                    
                    {uploadedImages.length > 0 && (
                         <div className="mt-4">
                               <h3 className="font-medium text-sm mb-2">Uploaded Images ({uploadedImages.length})</h3>
                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                   {uploadedImages.map((image, index) => {
                                        const totalIndex = index + selectedFiles.length;
                                        return (
                                            <div key={image.id} className={cn("relative group aspect-square", deletingUrl === image.url && "opacity-50 pointer-events-none")}>
                                                {deletingUrl === image.url && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md z-20">
                                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                        </div>
                                                )}
                                                <Image src={image.url} alt={`Uploaded ${index}`} fill className={cn("object-cover rounded-md border-2", mainImageIndex === totalIndex ? "border-primary" : "border-transparent")}/>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={() => removeUploadedImage(image.id)}
                                                    disabled={deletingUrl !== null}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                {mainImageIndex === totalIndex ? (
                                                     <Badge className="absolute bottom-1 left-1 z-10">Main</Badge>
                                                ) : (
                                                     <Button
                                                        type="button"
                                                        size="sm"
                                                        className="absolute bottom-1 left-1 h-auto px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        onClick={() => setMainImageIndex(totalIndex)}
                                                    >
                                                        Set as main
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                               </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pricing & Inventory</CardTitle>
                            <CardDescription>Manage variants or set a single price.</CardDescription>
                        </div>
                        <FormField
                            control={form.control}
                            name="variantsEnabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormLabel>Enable Variants</FormLabel>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {!variantsEnabled ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl><Input type="number" step="0.01" placeholder="99.99" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="discountPrice" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Price (Optional)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" placeholder="89.99" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="stock" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Quantity</FormLabel>
                                        <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="sku" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU (Optional)</FormLabel>
                                        <FormControl><Input placeholder="MASK-VG-01" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    ) : (
                        // Variants UI
                        <div className="space-y-6">
                            {/* --- OPTIONS --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Colors</Label>
                                    {colorFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`variantOptions.colors.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl><Input placeholder="e.g., Black" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeColor(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendColor({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Color</Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Sizes</Label>
                                    {sizeFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`variantOptions.sizes.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl><Input placeholder="e.g., Large" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendSize({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Size</Button>
                                </div>
                            </div>
                            <Separator />
                            {/* --- VARIANTS TABLE --- */}
                            <div>
                                <h3 className="text-lg font-medium mb-2">Generated Variants ({variantFields.length})</h3>
                                {variantFields.length > 0 ? (
                                  <>
                                    {/* Bulk Actions */}
                                    <div className="p-4 border rounded-lg bg-muted/50 mb-4 space-y-4">
                                        <h4 className="font-semibold text-sm">Bulk Apply</h4>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                            <Input type="number" placeholder="Price" onChange={e => handleBulkApply('price', e.target.value)} />
                                            <Input type="number" placeholder="Discount Price" onChange={e => handleBulkApply('discountPrice', e.target.value)} />
                                            <Input type="number" placeholder="Stock" onChange={e => handleBulkApply('stock', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Variant</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Discount Price</TableHead>
                                                    <TableHead>Stock</TableHead>
                                                    <TableHead>SKU</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {variantFields.map((field, index) => (
                                                    <TableRow key={field.id}>
                                                        <TableCell className="font-medium">
                                                          {field.color && field.size ? `${field.color} / ${field.size}` : field.color || field.size}
                                                        </TableCell>
                                                        <TableCell>
                                                          <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<Input type="number" {...field} className="w-24"/>)} />
                                                        </TableCell>
                                                        <TableCell>
                                                          <FormField control={form.control} name={`variants.${index}.discountPrice`} render={({ field }) => (<Input type="number" {...field} value={field.value ?? ''} className="w-24" />)} />
                                                        </TableCell>
                                                        <TableCell>
                                                          <FormField control={form.control} name={`variants.${index}.stock`} render={({ field }) => (<Input type="number" {...field} className="w-20" />)} />
                                                        </TableCell>
                                                         <TableCell>
                                                          <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (<Input {...field} value={field.value ?? ''} className="w-28" />)} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {form.formState.errors.variants && <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.variants.message || form.formState.errors.variants.root?.message}</p>}
                                  </>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
                                        <p>Add colors or sizes to generate variants.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <FormControl>
                                <SelectTrigger disabled={isLoadingCategories}>
                                <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingCategories ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.slug}>
                                    {cat.name}
                                    </SelectItem>
                                ))
                                )}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this product visible in the store.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Display this on the homepage.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productToEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
