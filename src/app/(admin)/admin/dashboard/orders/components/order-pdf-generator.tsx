'use client';

import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Order, Product } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
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

// Fetches an image via the proxy and returns its Base64 representation.
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
        // Return a transparent 1x1 pixel as a fallback.
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
    if (!firestore || productIdsToFetch.length === 0) return;

    const fetchAllProductImages = async () => {
      const idsNotInCache = productIdsToFetch.filter(id => !productImages[id]);
      if (idsNotInCache.length === 0) return;

      setProgressMessage(`Fetching ${idsNotInCache.length} product images...`);
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
      await Promise.all(Object.entries(newImageMap).map(async ([id, url]) => {
        if (url) {
            base64ImageMap[id] = await fetchImageAsBase64(url);
        } else {
            base64ImageMap[id] = null;
        }
      }));

      setProductImages(prev => ({ ...prev, ...base64ImageMap }));
      setProgressMessage('');
    };

    fetchAllProductImages();
  }, [firestore, productIdsToFetch, productImages]);


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

        if (i > 0 && i % cardsPerPage === 0) {
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
            scale: 2.5, // Increase scale for sharper text and images
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png', 1.0); // Use high quality PNG
        
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
  
  // The selected variant renders the hidden cards for capture but does not render a visible button.
  // The visible button is in the BulkActionsBar.
  if (variant === 'selected') {
    return (
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        {orders.map(order => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} productImages={productImages} />
        ))}
        {isGenerating && (
            <button id="hidden-pdf-trigger" onClick={() => generatePdf(orders)}></button>
        )}
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
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        {orders.map(order => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} productImages={productImages} />
        ))}
      </div>
    </>
  );
}

const shorten = (text: string, words = 5) => {
    return text.split(' ').slice(0, words).join(' ') + (text.split(' ').length > words ? '...' : '');
}

function PdfCardTemplate({ order, productImages }: { order: Order, productImages: ProductImageMap }) {
    const statusStyle = statusStyles[order.status] || { color: '#333', backgroundColor: '#eee' };
    
    return (
        <div 
            key={`pdf-card-${order.id}`} 
            id={`pdf-card-${order.id}`} 
            style={{ 
                width: '750px', 
                height: '260px', 
                display: 'flex', 
                flexDirection: 'column',
                fontFamily: 'Helvetica, Arial, sans-serif',
                backgroundColor: '#ffffff',
                color: '#111111',
                border: '1px solid #e3e3e3',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                padding: '16px',
            }}
        >
            {/* Top Section: Order Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #e3e3e3', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>Order #{order.id.substring(0, 12)}...</h3>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Total: ${order.total.toFixed(2)}</p>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '11px', color: '#555555' }}>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#333'}}>Customer:</span> {order.name}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#333'}}>Address:</span> {order.street}, {order.city}, {order.country}, {order.zip}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#333'}}>Email:</span> {order.email}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#333'}}>Date:</span> {format(order.createdAt.toDate(), 'yyyy-MM-dd')}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#333'}}>Phone:</span> {order.phone}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{fontWeight: 600, color: '#333'}}>Status:</span>
                        <div style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            borderRadius: '9999px',
                            textTransform: 'capitalize',
                            color: statusStyle.color,
                            backgroundColor: statusStyle.backgroundColor,
                        }}>{order.status}</div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Items */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {order.items.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', backgroundColor: '#eeeeee', border: '1px solid #e0e0e0' }}>
                            {productImages[item.productId] && <img src={productImages[item.productId]!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <p style={{ flexGrow: 1, fontSize: '12px', margin: 0, fontWeight: 500 }}>{shorten(item.name, 5)}</p>
                        <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Qty: {item.quantity}</p>
                        <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, minWidth: '55px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
