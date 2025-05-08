'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

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
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
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
                  <h3 className="font-medium text-lg">{design.case_style.phone_model}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mt-1">
                    <p>Phone: {design.case_style.phone_brand}</p>
                    <p>Material: {design.case_style.material}</p>
                    <p>Color: {design.case_style.color}</p>
                    <p className="font-semibold text-base mt-2">${design.case_style.price}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total}</span>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input
                type="tel"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="pickup"
                    checked={formData.deliveryMethod === 'pickup'}
                    onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                    className="form-radio text-pink-600"
                  />
                  <span className="ml-2">Pickup</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="delivery"
                    checked={formData.deliveryMethod === 'delivery'}
                    onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                    className="form-radio text-pink-600"
                  />
                  <span className="ml-2">Delivery</span>
                </label>
              </div>
            </div>

            {formData.deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#F4D7EA] to-[#D9FBFE] text-gray-800 py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 