
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
    pending: { color: '#8A6D00', backgroundColor: '#FFF6CC' },
    processing: { color: '#0D7F62', backgroundColor: '#DFF7F0' },
    shipped: { color: '#005B8A', backgroundColor: '#D6F0FF' },
    delivered: { color: '#3C7A11', backgroundColor: '#E4F6DA' },
    cancelled: { color: '#9E1A1A', backgroundColor: '#FDE2E2' },
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
        const orderIndex = i + 1;
        setProgressMessage(`Processing order ${orderIndex} of ${ordersToExport.length}...`);

        const isNewPage = i > 0 && i % cardsPerPage === 0;

        if (isNewPage) {
            pdf.addPage();
            yPos = margin;
        }

        const cardElement = document.getElementById(`pdf-card-${order.id}`);
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#FFFFFF' // White background for the page
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight, undefined, 'FAST');
        yPos += cardHeight + spacing;

        const isLastCardOnPage = (i + 1) % cardsPerPage === 0 || (i + 1) === ordersToExport.length;
        if (isLastCardOnPage) {
            pdf.setFontSize(8);
            pdf.setTextColor('#7A868C');
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
  
  if (variant === 'selected') {
    return (
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        {orders.map((order, index) => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} orderNumber={index + 1} productImages={productImages} />
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

      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        {orders.map((order, index) => (
          <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} orderNumber={index + 1} productImages={productImages} />
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

function PdfCardTemplate({ order, orderNumber, productImages }: { order: Order, orderNumber: number, productImages: ProductImageMap }) {
    const statusStyle = statusStyles[order.status] || { color: '#4F5B62', backgroundColor: '#E2E8EA' };
    
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
                backgroundColor: '#F7F9FA',
                color: '#3A464B',
                border: '1px solid #E2E8EA',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                padding: '16px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E8EEEE', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0, color: '#2F3E46' }}>Order: #{orderNumber}</h3>
                         <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 'bold' }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Customer:</span> {order.name}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#2F3E46' }}>Total: ${order.total.toFixed(2)}</p>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4px 16px', fontSize: '11px', fontWeight: 'bold' }}>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Email:</span> {order.email}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Phone:</span> {order.phone}</p>
                    <p style={{ margin: 0, gridColumn: 'span 2' }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Address:</span> {order.street}, {order.city}, {order.country}, {order.zip}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Date:</span> {format(order.createdAt.toDate(), 'yyyy-MM-dd HH:mm')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{fontWeight: 'bold', color: '#4F5B62'}}>Status:</span>
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

            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '8px', backgroundColor: '#E8F8EC', borderRadius: '8px' }}>
                {order.items.map(item => (
                    <div key={item.productId + (item.imageUrl || '')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#E2E8EA', border: '1px solid #D5DDDF' }}>
                            {productImages[item.productId] && <img src={productImages[item.productId]!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <p style={{ flexGrow: 1, fontSize: '12px', margin: 0, fontWeight: 'bold', color: '#3A464B' }}>{shorten(item.name, 5)}</p>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#4F5B62', margin: 0 }}><span style={{fontSize: '14px', fontWeight: 'bold'}}>Qty:</span> {item.quantity}</p>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, minWidth: '55px', textAlign: 'right', color: '#3A464B' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}


    