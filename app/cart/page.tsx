"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

const supabase = createClientComponentClient();

const TABS = ["Designs", "Orders"];

export default function CartPage() {
  const { session } = useSessionContext();
  const user = session?.user;
  const [activeTab, setActiveTab] = useState("Designs");
  const [userId, setUserId] = useState<number | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.email) return;
    const fetchUserId = async () => {
      const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("email", user.email)
        .single();
      if (data) setUserId(data.id);
    };
    fetchUserId();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    console.log("USER ID:", user?.id)
    setLoading(true);
    const fetchData = async () => {
      // Fetch all designs
      const { data: designsData } = await supabase
        .from("designs")
        .select("*");
      setDesigns(designsData || []);
      // Fetch all orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*");
      setOrders(ordersData || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Handler to delete a design
  const handleDelete = async (designId: string) => {
    await supabase.from("designs").delete().eq("id", designId);
    setDesigns((prev) => prev.filter((d) => d.id !== designId));
  };

  const handleDeleteSelected = async () => {
    if (selectedDesigns.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedDesigns.length} selected design(s)?`)) {
        await supabase.from("designs").delete().in("id", selectedDesigns);
        setDesigns((prev) => prev.filter((d) => !selectedDesigns.includes(d.id)));
        setSelectedDesigns([]);
    }
  };

  // Handler for selecting/deselecting a design
  const handleSelect = (designId: string) => {
    setSelectedDesigns((prev) => {
      if (prev.includes(designId)) {
        return prev.filter((id) => id !== designId);
      } else {
        return [...prev, designId];
      }
    });
  };

  // Handler for single checkout
  const handleSingleCheckout = (designId: string) => {
    router.push(`/checkout?designs=${designId}`);
  };

  // Handler for multi-checkout
  const handleMultiCheckout = () => {
    if (selectedDesigns.length > 0) {
      router.push(`/checkout?designs=${selectedDesigns.join(",")}`);
    }
  };

  // Get SMTP_FROM from env
  const SMTP_FROM = process.env.NEXT_PUBLIC_SMTP_FROM || process.env.SMTP_FROM || "";

  return (
    <div className="max-w-3xl mx-auto py-8 px-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="flex space-x-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              activeTab === tab
                ? "bg-purple text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {activeTab === "Designs" && (
            <div className="space-y-4">
              {designs.filter((design) => !design.orders || design.orders.length === 0).length === 0 ? (
                <div className="text-gray-500">No designs found.</div>
              ) : (
                designs
                  .filter((design) => !design.orders || design.orders.length === 0)
                  .map((design) => (
                    <div
                      key={design.id}
                      className="flex items-center justify-between bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedDesigns.includes(design.id)}
                          onChange={() => handleSelect(design.id)}
                          className="form-checkbox h-5 w-5 text-purple-600 mr-2"
                        />
                        {design.image_url && (
                          <img
                            src={design.image_url}
                            alt="Design"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-semibold">Design #{design.id.slice(0, 8)}</div>
                          <div className="text-sm text-gray-500">
                            Created: {design.created_at?.slice(0, 10)}
                          </div>
                        </div>
                      </div>
                  
                    </div>
                  ))
              )}
              {/* Floating action buttons */}
              <div className="fixed bottom-8 right-8 z-50 flex flex-col md:flex-row gap-4">
                  <button
                      className={`px-6 py-3 rounded-full text-white text-lg font-bold shadow-lg transition-all ${selectedDesigns.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      onClick={handleDeleteSelected}
                      disabled={selectedDesigns.length === 0}
                  >
                      Delete {selectedDesigns.length > 0 ? `(${selectedDesigns.length})` : ''}
                  </button>
                  <button
                      className={`px-6 py-3 rounded-full text-white text-lg font-bold shadow-lg transition-all ${selectedDesigns.length > 0 ? 'bg-purple hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      onClick={() => router.push(`/checkout?designs=${selectedDesigns.join(",")}`)}
                      disabled={selectedDesigns.length === 0}
                  >
                      Checkout {selectedDesigns.length > 0 ? `(${selectedDesigns.length})` : ''}
                  </button>
              </div>
            </div>
          )}
          {activeTab === "Orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-gray-500">No orders found.</div>
              ) : (
                orders.map((order) => {
                  let statusTag = null;
                  if (order.status === true) {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        Approved
                      </span>
                    );
                  } else if (order.status === false) {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        Rejected
                      </span>
                    );
                  } else {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                        Pending
                      </span>
                    );
                  }
                  return (
                    <div
                      key={order.order_id}
                      className="flex items-center justify-between bg-white rounded-lg shadow p-4"
                    >
                      <div>
                        <div className="font-semibold">Order #{order.order_id}</div>
                        <div className="text-sm text-gray-500">
                          Placed: {order.created_at?.slice(0, 10)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Design ID: {order.design_id}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {statusTag}
                        <a
                          href={`mailto:${SMTP_FROM}?subject=${encodeURIComponent(order.order_id + ' - Inquiry')}`}
                          className="px-3 py-1 rounded bg-purple text-white text-xs font-semibold hover:bg-purple-700"
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 