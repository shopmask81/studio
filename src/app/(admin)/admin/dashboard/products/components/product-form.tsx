
'use client';

import { useState, useEffect } from 'react';
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
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
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

// Image upload function for IMGBB
async function uploadToImgBB(file: File): Promise<string> {
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
    if (!result.data || !result.data.display_url) {
        throw new Error('Invalid response from image upload service.');
    }
    
    return result.data.display_url;
}

export function ProductForm({ productToEdit }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for image management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  useEffect(() => {
    if (productToEdit) {
      const allImages = [productToEdit.mainImage, ...(productToEdit.images || [])].filter(Boolean);
      setUploadedImageUrls(allImages);
      setMainImage(productToEdit.mainImage);
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
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setLocalPreviews(prev => [...prev, ...newPreviews]);
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
  };
  
  const removeUploadedImage = (urlToRemove: string) => {
    setUploadedImageUrls(prev => prev.filter(url => url !== urlToRemove));
    if (mainImage === urlToRemove) {
      setMainImage(null);
    }
  }

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No images selected', description: 'Please select images to upload first.'});
      return;
    }
    
    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => uploadToImgBB(file));
      const newUrls = await Promise.all(uploadPromises);
      
      setUploadedImageUrls(prev => [...prev, ...newUrls]);
      setSelectedFiles([]);
      setLocalPreviews([]); // Clear local previews after successful upload
      localPreviews.forEach(url => URL.revokeObjectURL(url)); // Manual cleanup
      
      toast({ title: 'Upload Successful', description: `${newUrls.length} images have been uploaded.`});
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'There was a problem uploading your images.'});
    } finally {
      setIsUploading(false);
    }
  };


  const onSubmit = async (data: ProductFormValues) => {
    if (!firestore) return;
    
    if (uploadedImageUrls.length === 0) {
      toast({ variant: 'destructive', title: 'No images uploaded', description: 'You must upload at least one image before saving.'});
      return;
    }

    if (!mainImage) {
        toast({ variant: 'destructive', title: 'Main image required', description: 'Please select a main image for the product.'});
        return;
    }

    setIsSubmitting(true);
    
    try {
        const additionalImages = uploadedImageUrls.filter(url => url !== mainImage);

        const productData = {
            ...data,
            mainImage: mainImage,
            images: additionalImages,
        };

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
        const path = productToEdit ? `products/${productToEdit.id}` : 'products';
        const operation = productToEdit ? 'update' : 'create';
        const permissionError = new FirestorePermissionError({
            path: path,
            operation: operation,
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error('Error saving product:', error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isCreateDisabled = uploadedImageUrls.length === 0 || !mainImage || isUploading || isSubmitting;

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
                    <CardDescription>Drag and drop images, then upload them and select a main image.</CardDescription>
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

                        {localPreviews.length > 0 && (
                            <div className="mt-4">
                               <h3 className="font-medium text-sm mb-2">Selected for Upload ({localPreviews.length})</h3>
                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                   {localPreviews.map((src, index) => (
                                       <div key={src} className="relative group aspect-square">
                                           <Image src={src} alt={`Preview ${index}`} fill className="object-cover rounded-md"/>
                                           <Button
                                               type="button"
                                               variant="destructive"
                                               size="icon"
                                               className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                               onClick={() => removeLocalPreview(index)}
                                           >
                                               <X className="h-4 w-4" />
                                           </Button>
                                       </div>
                                   ))}
                               </div>
                                <Button type="button" onClick={handleUploadImages} disabled={isUploading} className="mt-4">
                                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s) to IMGBB`}
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {uploadedImageUrls.length > 0 && (
                         <div className="mt-4">
                               <h3 className="font-medium text-sm mb-2">Uploaded Images</h3>
                               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                   {uploadedImageUrls.map((url, index) => (
                                       <div key={url} className="relative group aspect-square">
                                           <Image src={url} alt={`Uploaded ${index}`} fill className="object-cover rounded-md"/>
                                           <Button
                                               type="button"
                                               variant="destructive"
                                               size="icon"
                                               className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                               onClick={() => removeUploadedImage(url)}
                                           >
                                               <X className="h-4 w-4" />
                                           </Button>
                                           {mainImage === url ? (
                                                <Badge className="absolute bottom-1 left-1 z-10">Main</Badge>
                                           ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="absolute bottom-1 left-1 h-auto px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={() => setMainImage(url)}
                                                >
                                                    Set as main
                                                </Button>
                                           )}
                                       </div>
                                   ))}
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

    