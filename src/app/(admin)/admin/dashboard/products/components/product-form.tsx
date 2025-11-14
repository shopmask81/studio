
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

// Placeholder for your image upload function
async function uploadToImgBB(file: File): Promise<string> {
    const apiKey = '518d3cdcaedf3c5ade143a41de38c554';
    const formData = new FormData();
    
    // The API expects the file directly, not base64 for FormData
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
      setImagePreviews(allImages);
      setMainImage(productToEdit.mainImage);
    }
  }, [productToEdit]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newFiles = [...imageFiles, ...files];
      setImageFiles(newFiles);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      const allPreviews = [...imagePreviews, ...newPreviews];
      setImagePreviews(allPreviews);

      // If no main image is set, set the first one.
      if (!mainImage && allPreviews.length > 0) {
        setMainImage(allPreviews[0]);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
      const removedUrl = imagePreviews[indexToRemove];
      const newPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
      setImagePreviews(newPreviews);

      // If the removed image was the main image, reset it
      if (mainImage === removedUrl) {
          setMainImage(newPreviews.length > 0 ? newPreviews[0] : null);
      }
      
      // Clean up blob URLs to prevent memory leaks
      if (removedUrl.startsWith('blob:')) {
          URL.revokeObjectURL(removedUrl);
          
          // Try to remove the corresponding file from the files list
          // This is a bit tricky, best way is to associate files with previews via an ID
          // For simplicity, we assume the blobs are at the end and in order.
          const blobPreviews = imagePreviews.filter(p => p.startsWith('blob:'));
          const fileIndexToRemove = blobPreviews.indexOf(removedUrl);
          
          if(fileIndexToRemove !== -1) {
            const newImageFiles = imageFiles.filter((_, i) => {
                const fileBlobIndex = imageFiles.length - blobPreviews.length + i;
                return fileBlobIndex !== fileIndexToRemove;
            });
            setImageFiles(newImageFiles);
          }
      }
  };


  const onSubmit = async (data: ProductFormValues) => {
    if (!firestore) return;

    if (!mainImage) {
        toast({ variant: 'destructive', title: 'Main image required', description: 'You must select at least one image and set a main image.'});
        return;
    }

    setIsSubmitting(true);
    
    try {
        setIsUploading(true);
        const existingUrls = imagePreviews.filter(p => p.startsWith('http'));
        
        let uploadedImageUrls: string[] = [];
        if (imageFiles.length > 0) {
            const filesToUpload = imageFiles.filter(file => {
                const objectUrl = URL.createObjectURL(file);
                const shouldUpload = imagePreviews.includes(objectUrl);
                URL.revokeObjectURL(objectUrl); // Clean up immediately
                return shouldUpload;
            });
            const uploadPromises = filesToUpload.map(file => uploadToImgBB(file));
            uploadedImageUrls = await Promise.all(uploadPromises);
        }
        setIsUploading(false);
        
        const finalImageUrls = [...existingUrls, ...uploadedImageUrls];
        if (finalImageUrls.length === 0) {
            toast({ variant: 'destructive', title: 'Image required', description: 'You must upload at least one image.'});
            setIsSubmitting(false);
            return;
        }

        // Determine which URL from the final list corresponds to the main image
        const finalMainImage = finalImageUrls.find(url => url === mainImage || imagePreviews.indexOf(mainImage) === finalImageUrls.indexOf(url)) || finalImageUrls[0];
        const additionalImages = finalImageUrls.filter(url => url !== finalMainImage);

        const productData = {
            ...data,
            mainImage: finalMainImage,
            images: additionalImages,
        };

        if (productToEdit) {
            const productRef = doc(firestore, 'products', productToEdit.id);
            const dataToUpdate = { ...productData, updatedAt: serverTimestamp() };
            updateDoc(productRef, dataToUpdate)
                .then(() => {
                    toast({ title: 'Product Updated', description: 'The product has been successfully updated.' });
                    router.push('/admin/dashboard/products');
                    router.refresh();
                })
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: productRef.path,
                        operation: 'update',
                        requestResourceData: dataToUpdate,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setIsSubmitting(false);
                });

        } else {
            const collectionRef = collection(firestore, 'products');
            const dataToCreate = { ...productData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            addDoc(collectionRef, dataToCreate)
                .then(() => {
                    toast({ title: 'Product Created', description: 'The new product has been added.' });
                    router.push('/admin/dashboard/products');
                    router.refresh();
                })
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: collectionRef.path,
                        operation: 'create',
                        requestResourceData: dataToCreate,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setIsSubmitting(false);
                });
        }
    } catch (error) {
        console.error('Error preparing product for save:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload images or prepare the product.' });
        setIsSubmitting(false);
        setIsUploading(false);
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
                    <CardDescription>Upload images for your product gallery. The first image is the main image.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {imagePreviews.map((src, index) => (
                            <div key={src} className="relative group aspect-square">
                                <Image src={src} alt={`Preview ${index}`} fill className="object-cover rounded-md"/>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                {mainImage === src ? (
                                    <Badge className="absolute bottom-1 left-1 z-10">Main</Badge>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="absolute bottom-1 left-1 h-auto px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => setMainImage(src)}
                                    >
                                        Set as main
                                    </Button>
                                )}
                            </div>
                        ))}
                         <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground text-center">Click to upload</p>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} multiple accept="image/*" />
                        </label>
                    </div>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading images...' : (productToEdit ? 'Save Changes' : 'Create Product')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

