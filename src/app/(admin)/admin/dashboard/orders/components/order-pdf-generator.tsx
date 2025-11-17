
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  isLoading?: boolean;
  onGenerationStart?: () => void;
  onGenerationEnd?: () => void;
}

type ProductImageMap = Record<string, string | null>;

const statusStyles: { [key in Order['status']]: { color: string; backgroundColor: string; } } = {
    pending: { color: '#8A6D00', backgroundColor: '#FFF6CC' },
    processing: { color: '#0D7F62', backgroundColor: '#DFF7F0' },
    shipped: { color: '#0D7F62', backgroundColor: '#DFF7F0' }, // Using processing color for shipped
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

export function OrderPDFGenerator({ orders, variant = 'all', isLoading: isParentLoading, onGenerationStart, onGenerationEnd }: OrderPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const firestore = useFirestore();
  const [productImages, setProductImages] = useState<ProductImageMap>({});
  
  const preloadAllImages = useCallback(async (ordersToExport: Order[]): Promise<ProductImageMap> => {
      if (!firestore) return {};
      
      setProgressMessage('Loading product data...');
      // 1. Get all unique product IDs
      const allProductIds = [...new Set(ordersToExport.flatMap(order => order.items.map(item => item.productId)))];
      
      // 2. Fetch product documents to get image URLs
      const productUrlMap: Record<string, string | null> = {};
      const productChunks = [];
      for (let i = 0; i < allProductIds.length; i += 30) {
        productChunks.push(allProductIds.slice(i, i + 30));
      }
      
      await Promise.all(productChunks.map(async chunk => {
          if (chunk.length === 0) return;
          const productsRef = collection(firestore, 'products');
          const q = query(productsRef, where('__name__', 'in', chunk));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(doc => {
              const product = doc.data() as Product;
              productUrlMap[doc.id] = product.mainImage || product.images?.[0] || null;
          });
      }));

      // 3. Fetch all unique image URLs and convert to Base64
      setProgressMessage('Loading images...');
      const uniqueImageUrls = [...new Set(Object.values(productUrlMap).filter((url): url is string => !!url))];
      const base64UrlMap: Record<string, string> = {};
      
      await Promise.all(uniqueImageUrls.map(async url => {
          base64UrlMap[url] = await fetchImageAsBase64(url);
      }));
      
      // 4. Create the final map from productId to base64 image
      const finalImageMap: ProductImageMap = {};
      for (const productId in productUrlMap) {
          const url = productUrlMap[productId];
          if (url && base64UrlMap[url]) {
              finalImageMap[productId] = base64UrlMap[url];
          } else {
              finalImageMap[productId] = null;
          }
      }

      return finalImageMap;

  }, [firestore]);


  const generatePdfFromTemplates = useCallback(async (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0 || !document) return;

    setProgressMessage('Generating PDF...');

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const cardWidth = pdfWidth - margin * 2;
    const spacing = 10;
    let yPos = margin;

    for (let i = 0; i < ordersToExport.length; i++) {
        const order = ordersToExport[i];

        const headerHeight = 130;
        const itemRowHeight = 54; 
        const itemsHeight = order.items.length * itemRowHeight;
        const footerPadding = 16;
        const cardHeight = headerHeight + itemsHeight + footerPadding;
        
        console.log(`PDF Export Debug: OrderID=${order.id}, Items=${order.items.length}, ComputedHeight=${cardHeight}`);

        if (yPos > margin && yPos + cardHeight > pdfHeight - margin) {
            pdf.addPage();
            yPos = margin;
        }

        const cardElement = document.getElementById(`pdf-card-${order.id}`);
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
        });
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addImage(imgData, 'PNG', margin, yPos, cardWidth, cardHeight, undefined, 'FAST');
        yPos += cardHeight + spacing;
        
        const isLastOrder = i + 1 === ordersToExport.length;
        if (isLastOrder || yPos + 100 > pdfHeight - margin) { // Add footer if last order or near end of page
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
    onGenerationEnd?.();
    setProgressMessage('');
  }, [onGenerationEnd]);
  
  const startPdfGeneration = useCallback(async (ordersToExport: Order[]) => {
    if (ordersToExport.length === 0 || isGenerating) return;
    
    setIsGenerating(true);
    onGenerationStart?.();
    setProgressMessage(`Preparing ${ordersToExport.length} orders...`);
    
    // Step 1: Preload images and set them into state. This will trigger the useEffect below.
    const loadedImages = await preloadAllImages(ordersToExport);
    setProductImages(loadedImages);
  }, [isGenerating, onGenerationStart, preloadAllImages]);

  // This is the new effect that will handle the final PDF rendering step.
  useEffect(() => {
      // This will only run after productImages state has been updated and the component has re-rendered.
      if (isGenerating && Object.keys(productImages).length > 0) {
        // We use a timeout to give React a moment to render the images in the DOM
        const timer = setTimeout(() => {
          generatePdfFromTemplates(orders);
        }, 100);
        return () => clearTimeout(timer);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productImages, isGenerating, orders]);


  // Effect for auto-triggering the export for the 'selected' variant
  useEffect(() => {
    if (variant === 'selected' && orders.length > 0 && !isGenerating) {
      startPdfGeneration(orders);
    }
  }, [variant, orders, startPdfGeneration, isGenerating]);


  const isButtonDisabled = isGenerating || orders.length === 0 || isParentLoading;
  
  // This component now handles rendering the hidden templates for BOTH export types.
  // It's always in the DOM if there are orders to potentially export.
  if (variant === 'all' || (variant === 'selected' && isGenerating)) {
    return (
      <>
        {variant === 'all' && (
           <Button onClick={() => startPdfGeneration(orders)} disabled={isButtonDisabled}>
            {isGenerating || isParentLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? progressMessage : isParentLoading ? 'Loading Orders...' : `Export All (${orders.length})`}
          </Button>
        )}

        {/* This div is crucial. It holds the templates that html2canvas will capture.
            It's positioned off-screen. It renders the cards for the orders that are
            currently being processed for PDF generation. */}
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', backgroundColor: '#FFFFFF' }}>
          {orders.map((order, index) => (
            <PdfCardTemplate key={`pdf-card-${order.id}`} order={order} orderNumber={index + 1} productImages={productImages} />
          ))}
        </div>
      </>
    );
  }

  return null;
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
            {/* Top Section: Order Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E8EEEE', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0, color: '#2F3E46' }}>Order: #{orderNumber}</h3>
                         <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 'bold' }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Customer:</span> {order.name}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#2F3E46' }}>Total: ${typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}</p>
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4px 16px', fontSize: '11px', fontWeight: 'bold' }}>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Email:</span> {order.email}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Phone:</span> {order.phone}</p>
                    <p style={{ margin: 0, gridColumn: 'span 2' }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Address:</span> {order.street}, {order.city}, {order.country}, {order.zip}</p>
                    <p style={{ margin: 0 }}><span style={{fontWeight: 'bold', color: '#4F5B62'}}>Date:</span> {order.createdAt ? format(order.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
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

            {/* Bottom Section: Ordered Items */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'hidden', padding: '8px', backgroundColor: '#E8F8EC', borderRadius: '8px' }}>
                {order.items.map(item => (
                    <div key={item.productId + (item.imageUrl || '')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#E2E8EA', border: '1px solid #D5DDDF' }}>
                            {productImages[item.productId] && <img src={productImages[item.productId]!} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <p style={{ flexGrow: 1, fontSize: '12px', margin: 0, fontWeight: 'bold', color: '#3A464B' }}>{shorten(item.name, 5)}</p>
                        <p style={{ fontSize: '12px', color: '#4F5B62', margin: 0 }}><span style={{fontSize: '14px', fontWeight: 'bold'}}>QTY:</span> <span style={{fontWeight: 'bold'}}>{item.quantity}</span></p>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, minWidth: '55px', textAlign: 'right', color: '#3A464B' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

    
