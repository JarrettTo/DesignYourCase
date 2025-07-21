"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRef } from "react";

const TABS = [
  { label: "Pending", value: null },
  { label: "Approved", value: true },
  { label: "Rejected", value: false },
];
const PAGE_SIZE = 10;

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    phoneBrand: '',
    phoneModel: '',
    color: '',
    material: '',
    email: '',
  });
  const [searchEmail, setSearchEmail] = useState('');
  const [allOptions, setAllOptions] = useState<{
    phoneBrands: string[];
    phoneModels: string[];
    colors: string[];
    materials: string[];
  }>({
    phoneBrands: [],
    phoneModels: [],
    colors: [],
    materials: [],
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);
  const approveBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetchOptions();
  }, [orders]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [activeTab, page, filters, sortOrder]);

  async function fetchOptions() {
    // Extract unique options from all orders for filters
    const phoneBrands = Array.from(new Set(orders.map(o => o.designs?.case_styles?.phoneBrand).filter(Boolean)));
    const phoneModels = Array.from(new Set(orders.map(o => o.designs?.case_styles?.phoneModel).filter(Boolean)));
    const colors = Array.from(new Set(orders.map(o => o.designs?.case_styles?.color).filter(Boolean)));
    const materials = Array.from(new Set(orders.map(o => o.designs?.case_styles?.material).filter(Boolean)));
    setAllOptions({ phoneBrands, phoneModels, colors, materials });
  }

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select(`*, designs(*, case_styles(*))`)
      .order("created_at", { ascending: sortOrder === 'asc' });

    // Filtering
    if (filters.phoneBrand) query = query.eq('designs.case_styles.phoneBrand', filters.phoneBrand);
    if (filters.phoneModel) query = query.eq('designs.case_styles.phoneModel', filters.phoneModel);
    if (filters.color) query = query.eq('designs.case_styles.color', filters.color);
    if (filters.material) query = query.eq('designs.case_styles.material', filters.material);
    if (activeTab === true) query = query.eq('status', true);
    if (activeTab === false) query = query.eq('status', false);
    if (activeTab === null) query = query.is('status', null);

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;
    let ordersWithEmail = orders || [];
    if (!error && orders && orders.length > 0) {
      // Get unique customer_ids
      const customerIds = Array.from(new Set(orders.map(order => order.customer_id).filter(Boolean)));
      // Fetch emails for those customer_ids from user table
      const { data: users } = await supabase
        .from('user')
        .select('id, email')
        .in('id', customerIds);
      const userMap = Object.fromEntries((users || []).map(u => [u.id, u.email]));
      ordersWithEmail = orders.map(order => ({ ...order, email: userMap[order.customer_id] || '' }));
      setOrders(ordersWithEmail);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE) || 1);
    }
    setLoading(false);
  }

  async function updateStatus(order_id: string, status: boolean) {
    setUpdating(order_id);
    await supabase.from("orders").update({ status }).eq("order_id", order_id);
    await fetchOrders();
    setUpdating(null);
  }

  // Call API to send email and then approve
  async function handleApprove(order_id: string) {
    setUpdating(order_id);
    try {
      await fetch(`/api/order/email?id=${order_id}`);
      await updateStatus(order_id, true);
    } finally {
      setUpdating(null);
      setShowModal(false);
      setPendingApproveId(null);
    }
  }

  // UI Handlers
  const handleFilterChange = (e: any) => {
    setPage(1);
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  const handleSearch = () => {
    setPage(1);
    setFilters({ ...filters, email: searchEmail });
  };
  const clearFilters = () => {
    setFilters({ phoneBrand: '', phoneModel: '', color: '', material: '', email: '' });
    setSearchEmail('');
    setPage(1);
  };

  // Filter orders on the frontend to ensure only matching records are shown
  const filteredOrders = orders.filter(order => {
    if (filters.phoneBrand && order.designs?.case_styles?.phoneBrand !== filters.phoneBrand) return false;
    if (filters.phoneModel && order.designs?.case_styles?.phoneModel !== filters.phoneModel) return false;
    if (filters.color && order.designs?.case_styles?.color !== filters.color) return false;
    if (filters.material && order.designs?.case_styles?.material !== filters.material) return false;
    if (filters.email && !(order.email || '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Orders</h1>
      <div className="flex gap-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className={`px-4 py-2 rounded-md border ${activeTab === tab.value ? "bg-[#B5A4FF] text-white" : "bg-white text-[#B5A4FF]"}`}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs mb-1">Phone Brand</label>
          <select name="phoneBrand" value={filters.phoneBrand} onChange={handleFilterChange} className="px-3 py-2 rounded border">
            <option value="">All</option>
            {allOptions.phoneBrands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Phone Model</label>
          <select name="phoneModel" value={filters.phoneModel} onChange={handleFilterChange} className="px-3 py-2 rounded border">
            <option value="">All</option>
            {allOptions.phoneModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Color</label>
          <select name="color" value={filters.color} onChange={handleFilterChange} className="px-3 py-2 rounded border">
            <option value="">All</option>
            {allOptions.colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Material</label>
          <select name="material" value={filters.material} onChange={handleFilterChange} className="px-3 py-2 rounded border">
            <option value="">All</option>
            {allOptions.materials.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Sort by Date</label>
          <select
            value={sortOrder}
            onChange={e => { setSortOrder(e.target.value as 'asc' | 'desc'); setPage(1); }}
            className="px-3 py-2 rounded border min-w-[120px]"
          >
            <option value="desc">Newest First &darr;</option>
            <option value="asc">Oldest First &uarr;</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">User Email</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="Search email..."
              className="px-3 py-2 rounded border"
            />
            <button onClick={handleSearch} className="px-4 py-2 rounded bg-[#B5A4FF] text-white font-semibold">Search</button>
          </div>
        </div>
        <button onClick={clearFilters} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Clear</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm rounded-xl overflow-hidden" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="p-4 border">Order #</th>
              <th className="p-4 border">User Email</th>
              <th className="p-4 border">Design Image</th>
              <th className="p-4 border">Phone Brand</th>
              <th className="p-4 border">Phone Model</th>
              <th className="p-4 border">Material</th>
              <th className="p-4 border">Color</th>
              <th className="p-4 border">WhatsApp</th>
              <th className="p-4 border">Collection</th>
              <th className="p-4 border">Address</th>
              <th className="p-4 border">Proof of Payment</th>
              <th className="p-4 border">Status</th>
              <th className="p-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center p-4">Loading...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={13} className="text-center p-4">No orders found.</td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.order_id} className="border-b">
                  <td className="p-4 border">{order.order_id}</td>
                  <td className="p-4 border">{order.email || order.customer_id}</td>
                  <td className="p-4 border">
                    {order.designs?.image_url ? (
                      <a href={order.designs.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 border">{order.designs?.case_styles?.phoneBrand || '-'}</td>
                  <td className="p-4 border">{order.designs?.case_styles?.phoneModel || '-'}</td>
                  <td className="p-4 border">{order.designs?.case_styles?.material || '-'}</td>
                  <td className="p-4 border">{order.designs?.case_styles?.color || '-'}</td>
                  <td className="p-4 border">{order.whatsapp}</td>
                  <td className="p-4 border">{order.collection_method}</td>
                  <td className="p-4 border">{order.address}</td>
                  <td className="p-4 border">
                    {order.proof_of_payment ? (
                      <a href={order.proof_of_payment} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 border text-center">
                    {order.status === true ? "Approved" : order.status === false ? "Rejected" : "Pending"}
                  </td>
                  <td className="p-4 border">
                    <div className="flex gap-2 justify-center items-center">
                      <button
                        className="px-2 py-1 rounded bg-green-500 text-white disabled:opacity-50"
                        disabled={updating === order.order_id || order.status === true}
                        ref={approveBtnRef}
                        onClick={() => {
                          setShowModal(true);
                          setPendingApproveId(order.order_id);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-500 text-white disabled:opacity-50"
                        disabled={updating === order.order_id || order.status === false}
                        onClick={() => updateStatus(order.order_id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="font-semibold">Page {page} of {totalPages}</span>
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">Are you sure you want to approve this order?</h2>
            <p className="mb-6">Approving this will send an order request to the vendor with all the necessary information to produce the case</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                onClick={() => { setShowModal(false); setPendingApproveId(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-green-500 text-white font-semibold"
                onClick={() => pendingApproveId && handleApprove(pendingApproveId)}
                autoFocus
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 