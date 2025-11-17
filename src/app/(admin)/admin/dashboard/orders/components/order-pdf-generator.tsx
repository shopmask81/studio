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
  variant?: 'all' | 'selected';
  onExport?: (orders: Order[]) => void;
  isLoading?: boolean;
}

type ProductImageMap = Record<string, string | null>;

const statusStyles: { [key: string]: { color: string; backgroundColor: string; } } = {
    pending: { color: '#854d0e', backgroundColor: '#fefce8' }, // amber-800, yellow-50
    processing: { color: '#1e40af', backgroundColor: '#eff6ff' }, // blue-800, blue-50
    shipped: { color: '#5b21b6', backgroundColor: '#f5f3ff' }, // violet-800, violet-50
    delivered: { color: '#15803d', backgroundColor: '#f0fdf4' }, // green-800, green-50
    cancelled: { color: '#991b1b', backgroundColor: '#fef2f2' }, // red-800, red-50
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


export function OrderPDFGenerator({ orders, variant = 'all', onExport, isLoading: isParentLoading }: OrderPDFGeneratorProps) {
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
    if (!firestore || productIdsToFetch.length === 0 || isGenerating) return;

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
  }, [firestore, productIdsToFetch, productImages, isGenerating]);


  const generatePdf = async (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0) return;
    
    setIsGenerating(true);
    setProgressMessage(`Preparing ${ordersToExport.length} orders...`);
    
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const cardWidth = pdfWidth - margin * 2;
    const cardsPerPage = 3;
    const cardHeight = (pdfHeight - margin * 2) / cardsPerPage - 10;
    const spacing = 10;
    let yPos = margin;

    const exportTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm');

    for (let i = 0; i < ordersToExport.length; i++) {
        const order = ordersToExport[i];
        setProgressMessage(`Processing order ${i + 1} of ${ordersToExport.length}...`);

        if (i % cardsPerPage === 0 && i !== 0) {
            pdf.addPage();
            yPos = margin;
        }

        if (i % cardsPerPage === 0) {
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(`Exported on: ${exportTimestamp}`, pdfWidth / 2, margin / 2, { align: 'center' });
        }


        const cardElement = document.getElementById(`pdf-card-${order.id}`);
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png', 0.95); // Use PNG for quality
        
        pdf.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight, undefined, 'FAST');
        yPos += cardHeight + spacing;
    }

    setProgressMessage('Saving PDF...');
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    pdf.save(`orders-export-${timestamp}.pdf`);
    setIsGenerating(false);
    setProgressMessage('');
  };

  const allImagesLoaded = productIdsToFetch.every(id => productImages.hasOwnProperty(id));
  const isButtonDisabled = isGenerating || !allImagesLoaded || orders.length === 0 || isParentLoading;
  
  const handleExport = () => {
    if (onExport) {
        onExport(orders);
    } else {
        generatePdf(orders);
    }
  }
  
  // Render nothing if it's the "selected" variant button, as it's handled by BulkActionsBar
  if (variant === 'selected') {
    return (
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
        {orders.map(order => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} productImages={productImages} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => generatePdf(orders)} disabled={isButtonDisabled}>
        {isGenerating || isParentLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? progressMessage : isParentLoading ? 'Loading Orders...' : `Export All (${orders.length})`}
      </Button>

      {/* Hidden container for rendering cards for PDF generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
        {orders.map(order => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} productImages={productImages} />
        ))}
      </div>
    </>
  );
}


function PdfCardTemplate({ order, productImages }: { order: Order, productImages: ProductImageMap }) {
    const statusStyle = statusStyles[order.status] || { color: '#333', backgroundColor: '#eee' };
    
    return (
        <div 
            key={`pdf-card-${order.id}`} 
            id={`pdf-card-${order.id}`} 
            className="p-4 bg-[#f7f7f7] text-black" 
            style={{ 
                width: '750px', 
                height: '250px', 
                display: 'flex', 
                flexDirection: 'column',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                fontFamily: 'Helvetica, Arial, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>Order #{order.id.substring(0, 8)}...</h3>
                    <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>{format(order.createdAt.toDate(), 'yyyy-MM-dd HH:mm')}</p>
                </div>
                <div style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '9999px',
                    textTransform: 'capitalize',
                    color: statusStyle.color,
                    backgroundColor: statusStyle.backgroundColor,
                }}>
                    {order.status}
                </div>
            </div>

            {/* Body */}
            <div style={{ flexGrow: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>
                {/* Customer Info */}
                <div style={{ width: '35%', borderRight: '1px solid #e0e0e0', paddingRight: '16px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{order.name}</p>
                    <p style={{ color: '#555', margin: 0 }}>{order.email}</p>
                    <p style={{ color: '#555', margin: 0 }}>{order.phone}</p>
                    <div style={{ marginTop: 'auto', color: '#555' }}>
                        <p style={{ margin: 0 }}>{order.street}</p>
                        <p style={{ margin: 0 }}>{order.city}, {order.zip}</p>
                        <p style={{ margin: 0 }}>{order.country}</p>
                    </div>
                </div>

                {/* Items and Total */}
                <div style={{ width: '65%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                        {order.items.map(item => (
                            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#eee' }}>
                                    {productImages[item.productId] && <img src={productImages[item.productId]!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <p style={{ flexGrow: 1, fontSize: '11px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>x{item.quantity}</p>
                                <p style={{ fontSize: '11px', fontWeight: 600, margin: 0, minWidth: '50px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px', marginTop: 'auto', textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Total: ${order.total.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}