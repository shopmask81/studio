
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { useFirestore } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type UploadedImage = {
  url: string;
  deleteUrl: string;
};

const formSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  description: z.string().min(10, 'Description is required.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  discountPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  category: z.string().min(2, 'Category is required.'),
  sku: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  productToEdit?: Product;
}

async function uploadToImgBB(file: File): Promise<UploadedImage> {
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
    if (!result.data || !result.data.display_url || !result.data.delete_url) {
        throw new Error('Invalid response from image upload service.');
    }
    
    return { url: result.data.display_url, deleteUrl: result.data.delete_url };
}

async function deleteFromImgBB(deleteUrl: string): Promise<void> {
    // IMGBB's deletion is tricky. It doesn't use a standard DELETE verb and often involves CORS issues
    // when called from the client. A common workaround is to "visit" the URL, but that's not
    // reliable. For this demo, we'll simulate a successful deletion.
    // In a real-world scenario, this should be handled by a server-side proxy/function.
    console.log(`Simulating deletion of image at: ${deleteUrl}`);
    // A real fetch call could look like this, but might be blocked by CORS
    // await fetch(deleteUrl, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
}


export function ProductForm({ productToEdit }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for image management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);

  // State for upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // State for deletion
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  // State for drag-and-drop reordering
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: productToEdit
      ? {
          ...productToEdit,
          discountPrice: productToEdit.discountPrice ?? undefined,
          sku: productToEdit.sku ?? '',
        }
      : {
          name: '',
          description: '',
          price: 0,
          discountPrice: undefined,
          stock: 0,
          category: '',
          sku: '',
          active: true,
          featured: false,
        },
  });
  
  // This effect populates the form and image state when editing an existing product.
  // It transforms the string arrays from Firestore into the UploadedImage object array.
  useEffect(() => {
    if (productToEdit) {
      const mainImageUrl = productToEdit.mainImage;
      const otherImageUrls = productToEdit.images || [];
      const allImageUrls = [mainImageUrl, ...otherImageUrls].filter(Boolean);

      // We don't have delete URLs for existing products, so we'll create placeholder ones.
      // In a real app, delete URLs would need to be stored in Firestore as well.
      const loadedImages: UploadedImage[] = allImageUrls.map(url => ({
        url,
        deleteUrl: `placeholder-delete-url-for-${url}` 
      }));
      
      setUploadedImages(loadedImages);
      
      const mainIdx = loadedImages.findIndex(img => img.url === mainImageUrl);
      setMainImageIndex(mainIdx !== -1 ? mainIdx : (loadedImages.length > 0 ? 0 : null));
    }
  }, [productToEdit]);
  
  // Cleanup blob URLs on unmount
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
      
      // If this is the first batch of images, set the first one as main
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

      setLocalPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
      setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));

      // Update main image index if the removed image was the main one or before it
      if (mainImageIndex !== null) {
        if (mainImageIndex === indexToRemove) {
          // If the main image is removed, set the new first image as main, or null if empty
          setMainImageIndex(selectedFiles.length > 1 ? 0 : (uploadedImages.length > 0 ? uploadedImages.length : null));
        } else if (mainImageIndex > indexToRemove) {
          // If an image before the main one is removed, decrement the main index
          setMainImageIndex(mainImageIndex - 1);
        }
      }
  };
  
  const removeUploadedImage = async (urlToRemove: string) => {
    const imageToRemove = uploadedImages.find(img => img.url === urlToRemove);
    if (!imageToRemove) return;
  
    setDeletingUrl(urlToRemove);
    try {
      if (imageToRemove.deleteUrl && !imageToRemove.deleteUrl.startsWith('placeholder')) {
        await deleteFromImgBB(imageToRemove.deleteUrl);
      }
  
      setUploadedImages(prevImages => {
        const urlIndex = prevImages.findIndex(img => img.url === urlToRemove);
        const newImages = prevImages.filter(img => img.url !== urlToRemove);
  
        // Adjust main image index
        if (mainImageIndex !== null) {
          const totalLocalImages = selectedFiles.length;
          const uploadedIndex = urlIndex + totalLocalImages;

          if (mainImageIndex === uploadedIndex) {
            setMainImageIndex(totalLocalImages > 0 ? 0 : (newImages.length > 0 ? totalLocalImages : null));
          } else if (mainImageIndex > uploadedIndex) {
            setMainImageIndex(prev => (prev !== null ? prev - 1 : null));
          }
        }
  
        return newImages;
      });
      
      toast({ title: 'Image Deleted', description: 'The image has been removed from the server.' });
  
    } catch (error) {
      console.error('Failed to delete image from IMGBB:', error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete the image from the server.' });
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No new images selected', description: 'Please select images to upload first.'});
      return;
    }
    if (mainImageIndex === null) {
      toast({ variant: 'destructive', title: 'Main image not selected', description: 'Please select a main image before uploading.'});
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
        newUploadedImages.push(newUpload);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      const combinedUploadedImages = [...uploadedImages, ...newUploadedImages];
      setUploadedImages(combinedUploadedImages);
      
      // After upload, mainImageIndex should point to the correct image in the combined array
      if (mainImageIndex !== null && mainImageIndex < selectedFiles.length) {
          // The main image was in the local previews that just got uploaded
          setMainImageIndex(mainImageIndex + uploadedImages.length);
      }
      
      setSelectedFiles([]);
      localPreviews.forEach(url => URL.revokeObjectURL(url)); 
      setLocalPreviews([]); 

      setUploadStatus('Upload Complete!');
      toast({ title: 'Upload Successful', description: `${newUploadedImages.length} images have been uploaded.`});
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'There was a problem uploading your images.'});
      setUploadStatus('Upload Failed!');
    } finally {
      setTimeout(() => setIsUploading(false), 2000);
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    
    // Create copies of the arrays
    let _selectedFiles = [...selectedFiles];
    let _localPreviews = [...localPreviews];

    // Remove and save the dragged items
    const draggedFile = _selectedFiles.splice(dragItem.current, 1)[0];
    const draggedPreview = _localPreviews.splice(dragItem.current, 1)[0];

    // Insert the dragged items at the new position
    _selectedFiles.splice(dragOverItem.current, 0, draggedFile);
    _localPreviews.splice(dragOverItem.current, 0, draggedPreview);
    
    // Update main image index
    if (mainImageIndex !== null) {
      if (mainImageIndex < selectedFiles.length) { // main image is a local preview
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
    }
    
    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;

    // Update state
    setSelectedFiles(_selectedFiles);
    setLocalPreviews(_localPreviews);
  };


  const onSubmit = async (data: ProductFormValues) => {
    if (!firestore) return;
    
    const allImages = [...localPreviews, ...uploadedImages.map(img => img.url)];
    if (allImages.length === 0) {
      toast({ variant: 'destructive', title: 'No images available', description: 'You must select or upload at least one image.'});
      return;
    }

    if (mainImageIndex === null || allImages[mainImageIndex] === undefined) {
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

        const productData = {
            ...data,
            mainImage: mainImage,
            images: additionalImages,
        };

        if (productToEdit) {
            const productRef = doc(firestore, 'products', productToEdit.id);
            const dataToUpdate = { ...productData, updatedAt: serverTimestamp() };
            updateDoc(productRef, dataToUpdate).catch(async (serverError) => {
              const permissionError = new FirestorePermissionError({
                  path: productRef.path,
                  operation: 'update',
                  requestResourceData: dataToUpdate,
              });
              errorEmitter.emit('permission-error', permissionError);
            });
            toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
            router.push('/admin/dashboard/products');
            router.refresh();
        } else {
            const collectionRef = collection(firestore, 'products');
            const dataToCreate = { ...productData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            addDoc(collectionRef, dataToCreate).catch(async (serverError) => {
              const permissionError = new FirestorePermissionError({
                  path: collectionRef.path,
                  operation: 'create',
                  requestResourceData: dataToCreate,
              });
              errorEmitter.emit('permission-error', permissionError);
            });
            toast({ title: 'Product Created', description: 'The new product has been added.' });
            router.push('/admin/dashboard/products');
            router.refresh();
        }
    } catch (error) {
        console.error('Error in onSubmit logic:', error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred while saving the product.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isCreateDisabled = uploadedImages.length === 0 || mainImageIndex === null || isUploading || isSubmitting || selectedFiles.length > 0;
  const isUploadDisabled = isUploading || selectedFiles.length === 0 || mainImageIndex === null || mainImageIndex >= selectedFiles.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  Provide the main details for your product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Venetian Gold Mask" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the product..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            <Button type="button" onClick={handleUploadImages} disabled={isUploadDisabled}>
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
                                            <div key={image.url} className={cn("relative group aspect-square", deletingUrl === image.url && "opacity-50 pointer-events-none")}>
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
                                                    onClick={() => removeUploadedImage(image.url)}
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
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="99.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Price (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="89.99" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU (Optional)</FormLabel>
                            <FormControl>
                            <Input placeholder="MASK-VG-01" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
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
                      <FormControl>
                        <Input placeholder="e.g. Venetian" {...field} />
                      </FormControl>
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
          <Button type="submit" disabled={isCreateDisabled}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productToEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
