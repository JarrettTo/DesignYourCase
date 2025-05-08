'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { IoCloudUploadOutline } from "react-icons/io5";

interface Design {
  id: string;
  user_id: string;
  case_style: {
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

export default function CheckoutPage() {
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
        .rpc('get_designs_with_details', {
          design_ids: ids
        });

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
              case_style: {
                phone_model: design.phone_model,
                phone_brand: design.phone_brand,
                material: design.material,
                color: design.color,
                price: design.price,
                mockup: design.mockup
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
              case_style: {
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

  const total = designs.reduce((sum, design) => sum + design.case_style.price, 0);
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
    // TODO: Implement order creation
    console.log('Form submitted:', formData);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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
                    src={design.thumbnail_url || design.case_style.mockup}
                    alt={design.case_style.phone_model}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium text-lg">
                    {design.case_style.material.charAt(0).toUpperCase() + design.case_style.material.slice(1)} Case
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                    <p>Phone: {design.case_style.phone_brand.charAt(0).toUpperCase() + design.case_style.phone_brand.slice(1)} {design.case_style.phone_model.charAt(0).toUpperCase() + design.case_style.phone_model.slice(1)}</p>
                    <p>Color: {design.case_style.color.charAt(0).toUpperCase() + design.case_style.color.slice(1)}</p>
                    <p className="font-semibold text-base mt-2">${design.case_style.price}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  className="flex-grow px-4 py-3 rounded-md border border-gray-300 focus:border-[#B5A4FF] focus:ring-[#B5A4FF]"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <button
                  onClick={handleApplyDiscount}
                  className="px-4 py-2 bg-[#B5A4FF] text-white rounded-md hover:opacity-90 transition-opacity"
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
                  To proceed, please make full payment by bank transfer or CDM to the account below and upload the receipt of your transaction to confirm your order
                </p>
                <div className="space-y-2">
                  <p className="font-medium">BIBD</p>
                  <p>Design You Case Co.</p>
                  <p className="font-mono">12102912901290</p>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md text-white transition-opacity"
                style={{
                  background: 'linear-gradient(to right, #FB98D7, #51F0FD)'
                }}
              >
                <IoCloudUploadOutline size={20} />
                Upload Image
              </button>
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