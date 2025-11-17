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

const statusStyles: { [key in Order['status']]: { color: string; backgroundColor: string; } } = {
    pending: { color: '#e8d787', backgroundColor: '#2c2b1f' },
    processing: { color: '#7fd3b9', backgroundColor: '#1c2622' },
    shipped: { color: '#c0a0e0', backgroundColor: '#241f2c' }, // Retaining a purplish theme
    delivered: { color: '#8fe58c', backgroundColor: '#1d281d' },
    cancelled: { color: '#e58c8c', backgroundColor: '#291d1d' },
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

    for (let i = 0; i < ordersToExport.length; i++) {
        const order = ordersToExport[i];
        setProgressMessage(`Processing order ${i + 1} of ${ordersToExport.length}...`);

        const isNewPage = i > 0 && i % cardsPerPage === 0;

        if (isNewPage) {
            pdf.addPage();
            yPos = margin;
        }

        const cardElement = document.getElementById(`pdf-card-${order.id}`);
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
            scale: 3, // Increase scale for sharper text and images
            useCORS: true,
            backgroundColor: null, // Use transparent background for capture
        });
        const imgData = canvas.toDataURL('image/png', 1.0); // Use high quality PNG
        
        pdf.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight, undefined, 'FAST');
        yPos += cardHeight + spacing;

        const isLastCardOnPage = (i + 1) % cardsPerPage === 0 || (i + 1) === ordersToExport.length;
        if (isLastCardOnPage) {
            pdf.setFontSize(8);
            pdf.setTextColor('#3f4a45');
            const exportTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
            pdf.text(`Exported on: ${exportTimestamp}`, pdfWidth / 2, pdfHeight - margin / 2, { align: 'center' });
        }

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
    if (!text) return '';
    const splitText = text.split(' ');
    return splitText.slice(0, words).join(' ') + (splitText.length > words ? '...' : '');
}

function PdfCardTemplate({ order, productImages }: { order: Order, productImages: ProductImageMap }) {
    const statusStyle = statusStyles[order.status] || { color: '#e7ece9', backgroundColor: '#1f2b26' };
    
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
                backgroundColor: '#0f1612',
                color: '#e7ece9',
                border: '1px solid #1a2420',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                padding: '16px',
            }}
        >
            {/* Top Section: Order Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #1f2b26', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0, color: '#d2b48c' }}>Order #{order.id.substring(0, 12)}...</h3>
                         <p style={{ margin: '4px 0 0', fontSize: '12px' }}><span style={{fontWeight: 600, color: '#d2b48c'}}>Customer:</span> {order.name}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#d2b48c' }}>Total: ${order.total.toFixed(2)}</p>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4px 16px', fontSize: '11px', color: '#e7ece9' }}>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#d2b48c'}}>Email:</span> {order.email}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#d2b48c'}}>Phone:</span> {order.phone}</p>
                    <p style={{ margin: 0, gridColumn: 'span 2' }}><span style={{fontWeight: 600, color: '#d2b48c'}}>Address:</span> {order.street}, {order.city}, {order.country}, {order.zip}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 600, color: '#d2b48c'}}>Date:</span> {format(order.createdAt.toDate(), 'yyyy-MM-dd')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{fontWeight: 600, color: '#d2b48c'}}>Status:</span>
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
                    <div key={item.productId + (item.imageUrl || '')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', backgroundColor: '#2c3a34', border: '1px solid #2c3a34' }}>
                            {productImages[item.productId] && <img src={productImages[item.productId]!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <p style={{ flexGrow: 1, fontSize: '12px', margin: 0, fontWeight: 500, color: '#e7ece9' }}>{shorten(item.name, 5)}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Qty: {item.quantity}</p>
                        <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, minWidth: '55px', textAlign: 'right', color: '#e7ece9' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
