
'use client';

import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Order, Product } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderPDFGeneratorProps {
  orders: Order[];
}

type ProductImageMap = Record<string, string | null>;

const statusStyles: { [key: string]: string } = {
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};


async function fetchImageAsBase64(url: string): Promise<string> {
    try {
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error fetching image as base64:', error);
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel
    }
}


export function OrderPDFGenerator({ orders }: OrderPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const firestore = useFirestore();
  const [productImages, setProductImages] = useState<ProductImageMap>({});

  const productIdsToFetch = useMemo(() => {
    return [
      ...new Set(
        orders.flatMap(order => order.items.map(item => item.productId))
      )
    ];
  }, [orders]);

  useEffect(() => {
    if (!firestore || productIdsToFetch.length === 0) return;

    const fetchAllProductImages = async () => {
      const idsNotInCache = productIdsToFetch.filter(id => !productImages[id]);
      if (idsNotInCache.length === 0) return;

      const newImageMap: ProductImageMap = {};
      const productChunks = [];
      for (let i = 0; i < idsNotInCache.length; i += 30) {
        productChunks.push(idsNotInCache.slice(i, i + 30));
      }

      for (const chunk of productChunks) {
        const productsRef = collection(firestore, 'products');
        const q = query(productsRef, where('__name__', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const product = doc.data() as Product;
          newImageMap[doc.id] = product.mainImage || product.images?.[0] || null;
        });
      }
      
      const base64ImageMap: ProductImageMap = {};
      for (const [id, url] of Object.entries(newImageMap)) {
          if (url) {
              base64ImageMap[id] = await fetchImageAsBase64(url);
          } else {
              base64ImageMap[id] = null;
          }
      }

      setProductImages(prev => ({ ...prev, ...base64ImageMap }));
    };

    fetchAllProductImages();
  }, [firestore, productIdsToFetch, productImages]);


  const generatePdf = async () => {
    setIsGenerating(true);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const cardWidth = pdfWidth - margin * 2;
    const cardHeight = 250; // Approximate height for each card
    const spacing = 10;
    let yPos = margin;

    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        setProgressMessage(`Processing order ${i + 1} of ${orders.length}...`);

        const cardElement = document.getElementById(`pdf-card-${order.id}`);
        if (!cardElement) continue;

        if (yPos + cardHeight > pdfHeight - margin) {
            pdf.addPage();
            yPos = margin;
        }

        const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight, undefined, 'FAST');
        yPos += cardHeight + spacing;
    }

    setProgressMessage('Saving PDF...');
    const date = new Date().toISOString().split('T')[0];
    pdf.save(`orders-export-${date}.pdf`);
    setIsGenerating(false);
    setProgressMessage('');
  };

  const allImagesLoaded = productIdsToFetch.every(id => productImages.hasOwnProperty(id));

  return (
    <>
      <Button onClick={generatePdf} disabled={isGenerating || !allImagesLoaded}>
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? progressMessage : 'Export as PDF'}
      </Button>

      {/* Hidden container for rendering cards for PDF generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        {orders.map(order => (
          <div key={`pdf-card-${order.id}`} id={`pdf-card-${order.id}`} className="p-4 border rounded-lg bg-white text-black font-sans" style={{ width: '750px', height: '250px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}</h3>
                    <p className="text-xs text-gray-500">{format(order.createdAt.toDate(), 'PPP')}</p>
                </div>
                 <Badge variant="outline" className={cn("capitalize border text-xs", statusStyles[order.status])}>
                    {order.status}
                </Badge>
            </div>
             <div className="flex-grow flex gap-4 overflow-hidden">
                <div className="w-1/3 border-r pr-4 space-y-1 text-sm">
                    <p className="font-semibold">{order.name}</p>
                    <p className="text-gray-600">{order.email}</p>
                    <p className="text-gray-600">{order.phone}</p>
                    <p className="text-gray-600 mt-2">{order.street}</p>
                    <p className="text-gray-600">{order.city}, {order.zip}</p>
                    <p className="text-gray-600">{order.country}</p>
                </div>
                <div className="w-2/3 flex flex-col">
                    <div className="flex-grow space-y-1 overflow-y-auto text-xs pr-2">
                        {order.items.map(item => (
                            <div key={item.productId} className="flex items-center gap-2">
                                <div className="relative w-8 h-8 rounded-sm overflow-hidden flex-shrink-0">
                                   {productImages[item.productId] && <Image src={productImages[item.productId]!} alt={item.name} layout="fill" objectFit="cover" />}
                                </div>
                                <p className="flex-grow truncate">{item.name}</p>
                                <p className="text-gray-500">x{item.quantity}</p>
                                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                     <p className="font-bold text-lg text-right mt-2 pt-2 border-t">Total: ${order.total.toFixed(2)}</p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
