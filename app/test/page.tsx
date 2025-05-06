'use client';

import { useState, useEffect } from 'react';
import { insertOrder, getUserOrders, getOrderById, Order } from '@/lib/database/orders';

export default function TestPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInsertedOrderId, setLastInsertedOrderId] = useState<string | null>(null);

  // Test customer email
  const TEST_CUSTOMER_EMAIL = 'test@example.com';
  
  const handleInsertOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dummyOrder = {
        design_id: 'da2b12e3-b158-4285-9224-69ab14662669',
        whatsapp: '+1234567890',
        collection_method: 'pickup',
        address: '123 Test Street, Test City',
        additional_notes: 'This is a test order',
        proof_of_payment: 'https://example.com/proof.jpg'
      };

      const result = await insertOrder(TEST_CUSTOMER_EMAIL, dummyOrder);
      
      if (result) {
        setLastInsertedOrderId(result.order_id);
        alert(`Order inserted successfully! Order ID: ${result.order_id}`);
        // Refresh the orders list
        fetchOrders();
      } else {
        setError('Failed to insert order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserOrders(TEST_CUSTOMER_EMAIL);
      setOrders(result);
      if (!result) {
        setError('No orders found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificOrder = async () => {
    if (!lastInsertedOrderId) {
      alert('Please insert an order first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getOrderById(lastInsertedOrderId);
      if (result) {
        alert(`Found order: ${JSON.stringify(result, null, 2)}`);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Order Functions Test Page</h1>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={handleInsertOrder}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              Insert Test Order
            </button>
            
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Refresh Orders
            </button>
            
            <button
              onClick={fetchSpecificOrder}
              disabled={loading || !lastInsertedOrderId}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Fetch Last Inserted Order
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-gray-600">Loading...</div>
        )}

        {error && (
          <div className="text-red-500 bg-red-50 p-4 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Orders List</h2>
          <div className="text-sm text-gray-600 mb-4">Testing with email: {TEST_CUSTOMER_EMAIL}</div>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Order ID:</strong> {order.order_id}</div>
                    <div><strong>Customer Email:</strong> {order.customer_id}</div>
                    <div><strong>Design ID:</strong> {order.design_id}</div>
                    <div><strong>WhatsApp:</strong> {order.whatsapp}</div>
                    <div><strong>Collection:</strong> {order.collection_method}</div>
                    <div><strong>Address:</strong> {order.address}</div>
                    <div><strong>Notes:</strong> {order.additional_notes || 'N/A'}</div>
                    <div><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No orders found</div>
          )}
        </div>
      </div>
    </div>
  );
} 