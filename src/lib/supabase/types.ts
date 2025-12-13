// Database types - This will be generated from Supabase later
// For now, we'll use a basic structure that matches our schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'cashier' | 'staff';
          outlet_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'admin' | 'cashier' | 'staff';
          outlet_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'cashier' | 'staff';
          outlet_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      outlets: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          outlet_id: string;
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          available: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          name: string;
          description?: string | null;
          price: number;
          category?: string | null;
          available?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          category?: string | null;
          available?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          outlet_id: string;
          name: string;
          status: 'EMPTY' | 'OCCUPIED' | 'BILLED';
          capacity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          name: string;
          status?: 'EMPTY' | 'OCCUPIED' | 'BILLED';
          capacity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          name?: string;
          status?: 'EMPTY' | 'OCCUPIED' | 'BILLED';
          capacity?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          outlet_id: string;
          table_id: string | null;
          user_id: string;
          status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
          order_type: 'DINE_IN' | 'TAKEAWAY';
          payment_method: 'CASH' | 'UPI' | 'CARD' | null;
          subtotal: number;
          tax: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          table_id?: string | null;
          user_id: string;
          status?: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
          order_type: 'DINE_IN' | 'TAKEAWAY';
          payment_method?: 'CASH' | 'UPI' | 'CARD' | null;
          subtotal: number;
          tax: number;
          total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          table_id?: string | null;
          user_id?: string;
          status?: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
          order_type?: 'DINE_IN' | 'TAKEAWAY';
          payment_method?: 'CASH' | 'UPI' | 'CARD' | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_id?: string;
          quantity?: number;
          price?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

