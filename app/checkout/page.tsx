'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { IoCloudUploadOutline } from "react-icons/io5";
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface Design {
  id: string;
  user_id: string;
  case_styles: {
    phone_model: string;
    phone_brand: string;
    material: string;
    color: string;
    price: number;
    mockup: string;
  };
  thumbnail_url?: string;
  image_urls: string[];
}

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    deliveryMethod: 'pickup',
    address: ''
  });
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const { session } = useSessionContext();
  const router = useRouter();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const designIds = searchParams.get('designs')?.split(',') || [];
    if (designIds.length > 0) {
      fetchDesigns(designIds);
    }
  }, [searchParams]);

  async function fetchDesigns(ids: string[]) {
    try {
      // Fetch designs with case style details using the database function
      const { data: designsData, error: designsError } = await supabase
        .from('designs')
        .select(`id, user_id, case_style_id, case_styles:case_style_id (phoneModel, phoneBrand, material, color, price, mockup)`)
        .in('id', ids);

      if (designsError) {
        console.error('Error fetching designs:', designsError);
        throw designsError;
      }

      if (!designsData || designsData.length === 0) {
        console.error('No designs found');
        return;
      }
      
      // Fetch thumbnails for each design
      const designsWithThumbnails = await Promise.all(
        designsData.map(async (design: any) => {
          try {
            // Get the stage thumbnail URL
            const { data: { publicUrl: stageUrl } } = supabase.storage
              .from('phone-case-designs')
              .getPublicUrl(`design-images/${design.user_id}/${design.id}/stage.png`);

            // Get all image URLs for this design
            const { data: imageFiles, error: imageError } = await supabase.storage
              .from('phone-case-designs')
              .list(`design-images/${design.user_id}/${design.id}`);

            if (imageError) {
              console.error('Error fetching design images:', imageError);
              throw imageError;
            }

            // Get public URLs for all images
            const imageUrls = await Promise.all(
              (imageFiles || []).map(async (file) => {
                const { data: { publicUrl } } = supabase.storage
                  .from('phone-case-designs')
                  .getPublicUrl(`design-images/${design.user_id}/${design.id}/${file.name}`);
                return publicUrl;
              })
            );

            const designData: Design = {
              id: design.id,
              user_id: design.user_id,
              case_styles: {
                phone_model: design.case_styles.phoneModel,
                phone_brand: design.case_styles.phoneBrand,
                material: design.case_styles.material,
                color: design.case_styles.color,
                price: design.case_styles.price,
                mockup: design.case_styles.mockup
              },
              thumbnail_url: stageUrl,
              image_urls: imageUrls
            };

            return designData;
          } catch (error) {
            console.error(`Error processing design ${design.id}:`, error);
            const fallbackDesign: Design = {
              id: design.id,
              user_id: design.user_id,
              case_styles: {
                phone_model: design.phone_model,
                phone_brand: design.phone_brand,
                material: design.material,
                color: design.color,
                price: design.price,
                mockup: design.mockup
              },
              thumbnail_url: design.mockup,
              image_urls: []
            };
            return fallbackDesign;
          }
        })
      );

      setDesigns(designsWithThumbnails);
    } catch (error) {
      console.error('Error in fetchDesigns:', error);
    } finally {
      setLoading(false);
    }
  }

  const total = designs.reduce((sum, design) => sum + (Number(design.case_styles?.price) || 0), 0);
  const discountedTotal = discountApplied ? total * 0.8 : total;

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'SHIRLEY') {
      setDiscountApplied(true);
    } else {
      setDiscountApplied(false);
      alert('Invalid discount code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      alert('You must be logged in to place an order.');
      return;
    }
    if (!designs.length) {
      alert('No design selected.');
      return;
    }
    if (!receiptImage) {
      alert('Please upload a payment receipt.');
      return;
    }
    try {
      // 1. Get user id from Supabase Auth session
      const userId = session.user.id;
      // 2. Upload receipt image to payment-screenshots/{design_id}/<datetime>.ext (use first design for path)
      const designId = designs[0].id;
      const fileExt = receiptImage.name.split('.').pop();
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-');
      const filePath = `${designId}/${dateStr}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, receiptImage);
      if (uploadError) {
        throw new Error('Failed to upload receipt image.');
      }
      // 3. Get public URL for uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(filePath);
      const proofOfPaymentUrl = publicUrlData?.publicUrl;
      // 4. Generate a unique order_id for this group of orders
      const orderId = uuidv4();
      // 5. Insert an order for each design
      for (const design of designs) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: userId,
            design_id: design.id,
            order_id: orderId,
            whatsapp: formData.whatsapp,
            collection_method: formData.deliveryMethod,
            address: formData.deliveryMethod === 'delivery' ? formData.address : null,
            proof_of_payment: proofOfPaymentUrl,
            discount_code: discountApplied ? discountCode : null,
          });
        if (orderError) {
          throw new Error('Failed to create order for design ' + design.id);
        }
      }
      setOrderNumber(orderId);
      setOrderSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Order failed.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#22C55E"/>
              <path d="M7 13.5L11 17L17 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-center">Order Placed Successfully!</h2>
          <div className="text-lg font-semibold mb-2 text-center">Order # {orderNumber?.slice(0, 8)}</div>
          <p className="text-center mb-6">
            Thank you for your order!<br/>
            Your order is being processed. You&apos;ll receive an order confirmation on WhatsApp once we verify your payment.<br/><br/>
            If you have any questions, please feel free to WhatsApp us at +673 7446766
          </p>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-white transition-opacity cursor-pointer text-lg font-semibold"
            style={{ background: 'linear-gradient(to right, #FB98D7, #51F0FD)' }}
            onClick={() => router.push('/')}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          <div className="space-y-6">
            {designs.map((design) => (
              <div key={design.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={design.thumbnail_url || design.case_styles.mockup}
                    alt={design.case_styles.phone_model}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-grow">
                  <div className="font-semibold">Design #{design.id.slice(0, 8)}</div>
                  <h3 className="font-medium text-lg">
                    {design.case_styles.material?.charAt(0).toUpperCase() + design.case_styles.material?.slice(1)} Case
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                    <p>Phone: {design.case_styles.phone_brand?.charAt(0)?.toUpperCase() + design.case_styles.phone_brand?.slice(1)} {design.case_styles.phone_model?.charAt(0)?.toUpperCase() + design.case_styles.phone_model?.slice(1)}</p>
                    <p>Color: {design.case_styles.color?.charAt(0).toUpperCase() + design.case_styles?.color?.slice(1)}</p>
                    <p className="font-semibold text-base mt-2">${design.case_styles.price ? design.case_styles.price : '0.00'}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  className="flex-grow px-2 text-sm md:text-md md:px-4 py-3 max-w-2/3 rounded-md border border-gray-300 focus:border-[#B5A4FF] focus:ring-[#B5A4FF]"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <button
                  onClick={handleApplyDiscount}
                  className="px-2 md:px-4 py-2 bg-[#B5A4FF] text-sm md:text-md text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Apply
                </button>
              </div>
              {discountApplied && (
                <div className="text-green-600 font-medium">
                  Discount applied: -20%
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${discountedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-[#B5A4FF] focus:ring-[#B5A4FF]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input
                type="tel"
                required
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-[#B5A4FF] focus:ring-[#B5A4FF]"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
              <div className="flex rounded-md overflow-hidden border border-[#B5A4FF]">
                <button
                  type="button"
                  className={`flex-1 py-3 px-4 text-center transition-colors ${
                    formData.deliveryMethod === 'pickup'
                      ? 'bg-[#B5A4FF] text-white'
                      : 'bg-white text-[#B5A4FF]'
                  }`}
                  onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 px-4 text-center transition-colors ${
                    formData.deliveryMethod === 'delivery'
                      ? 'bg-[#B5A4FF] text-white'
                      : 'bg-white text-[#B5A4FF]'
                  }`}
                  onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery' })}
                >
                  Delivery ($5)
                </button>
              </div>
              {formData.deliveryMethod === 'pickup' && (
                <div className="mt-3 text-sm text-gray-600 text-center">
                  Pick-Up location is at<br />
                  <span className="font-medium">Faza Cube, Gadong Central</span>
                  <br /><br />
                  Your case will be ready in 2-3 weeks after order confirmation
                </div>
              )}
            </div>

            {formData.deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-[#B5A4FF] focus:ring-[#B5A4FF]"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-3">
                  To proceed, please make <span className='font-bold'>full payment</span> by bank transfer or CDM to the account below and upload the receipt of your transaction to confirm your order
                </p>
                <div className="space-y-2">
                  <p className="font-medium">BAIDURI</p>
                  <p>Shirley Ng Le Yee</p>
                  <p className="font-mono">0800707-472889</p>
                </div>
              </div>
              <div>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptImage(file);
                      setReceiptPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <label htmlFor="receipt-upload" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-white transition-opacity cursor-pointer" style={{ background: 'linear-gradient(to right, #FB98D7, #51F0FD)' }}>
                  <IoCloudUploadOutline size={20} />
                  {receiptImage ? 'Change Image' : 'Upload Image'}
                </label>
                {receiptPreview && (
                  <div className="mt-2 flex justify-center">
                    <img src={receiptPreview} alt="Receipt Preview" className="max-h-40 rounded shadow" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#B5A4FF] text-white py-3 px-4 rounded-md hover:opacity-90 transition-opacity"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageInner />
    </Suspense>
  );
} 