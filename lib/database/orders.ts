import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Import the Supabase client
import { supabase } from '../supabaseClient';

export interface OrderInput {
  design_id: string;
  whatsapp: string;
  collection_method: string;
  address: string;
  additional_notes?: string;
  proof_of_payment?: string;
}

export interface Order {
  id: number;
  order_id: string;
  customer_id: string;
  design_id: string;
  whatsapp: string;
  collection_method: string;
  address: string;
  additional_notes: string | null;
  proof_of_payment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert a new order into the database
 * @param customerEmail - The email of the customer placing the order
 * @param orderData - The order details
 * @returns The newly created order or null if there was an error
 */
export async function insertOrder(
  customerEmail: string,
  orderData: OrderInput
): Promise<Order | null> {
  try {
    const { data, error } = await supabase.rpc('insert_order', {
      p_customer_id: customerEmail,
      p_design_id: orderData.design_id,
      p_whatsapp: orderData.whatsapp,
      p_collection_method: orderData.collection_method,
      p_address: orderData.address,
      p_additional_notes: orderData.additional_notes || null,
      p_proof_of_payment: orderData.proof_of_payment || null
    });

    if (error) {
      console.error('Error inserting order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error inserting order:', error);
    return null;
  }
}

/**
 * Get all orders for a specific customer
 * @param customerEmail - The email of the customer
 * @returns An array of orders or null if there was an error
 */
export async function getUserOrders(customerEmail: string): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_orders', {
      p_customer_id: customerEmail
    });

    if (error) {
      console.error('Error fetching user orders:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return null;
  }
}

/**
 * Get a specific order by its order_id
 * @param orderId - The unique order ID
 * @returns The order or null if not found or there was an error
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
} 