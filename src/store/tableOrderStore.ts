import { create } from 'zustand';
import { Table, Order, TableStatus, OrderWithItems } from '@/lib/types';

interface TableOrderStore {
  tables: Table[];
  orders: Order[];
  setTables: (tables: Table[]) => void;
  setOrders: (orders: Order[]) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  addOrder: (order: Order | OrderWithItems) => void;
  updateOrder: (order: Order | OrderWithItems) => void;
  markOrderBilled: (orderId: string) => void;
  getTableById: (tableId: string) => Table | undefined;
}

export const useTableOrderStore = create<TableOrderStore>((set, get) => ({
  tables: [],
  orders: [],

  setTables: (tables) => set({ tables }),

  setOrders: (orders) => set({ orders }),

  updateTableStatus: (tableId, status) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, status } : table
      ),
    })),

  addOrder: (order) => {
    set((state) => {
      const newOrders = [...state.orders, order];
      const newTables = [...state.tables];

      // If DINE_IN order, update table status to OCCUPIED
      if (order.table_id && order.order_type === 'DINE_IN') {
        const tableIndex = newTables.findIndex((t) => t.id === order.table_id);
        if (tableIndex !== -1) {
          newTables[tableIndex] = {
            ...newTables[tableIndex],
            status: TableStatus.OCCUPIED,
          };
        }
      }

      return { orders: newOrders, tables: newTables };
    });
  },

  updateOrder: (order) => {
    set((state) => {
      const newOrders = state.orders.map((o) =>
        o.id === order.id ? order : o
      );
      const newTables = [...state.tables];

      // Handle table status based on order status
      if (order.table_id && order.order_type === 'DINE_IN') {
        const tableIndex = newTables.findIndex((t) => t.id === order.table_id);
        if (tableIndex !== -1) {
          if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            // Order completed or cancelled, free the table
            newTables[tableIndex] = {
              ...newTables[tableIndex],
              status: TableStatus.EMPTY,
            };
          } else if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
            // Order is active, table should be occupied
            newTables[tableIndex] = {
              ...newTables[tableIndex],
              status: TableStatus.OCCUPIED,
            };
          }
        }
      }

      return { orders: newOrders, tables: newTables };
    });
  },

  markOrderBilled: (orderId) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return state;

      const updatedOrder = { ...order, status: 'COMPLETED' as const };
      const newOrders = state.orders.map((o) =>
        o.id === orderId ? updatedOrder : o
      );
      const newTables = [...state.tables];

      // If DINE_IN order, set table to EMPTY
      if (order.table_id && order.order_type === 'DINE_IN') {
        const tableIndex = newTables.findIndex((t) => t.id === order.table_id);
        if (tableIndex !== -1) {
          newTables[tableIndex] = {
            ...newTables[tableIndex],
            status: TableStatus.EMPTY,
          };
        }
      }

      return { orders: newOrders, tables: newTables };
    });
  },

  getTableById: (tableId) => {
    return get().tables.find((t) => t.id === tableId);
  },
}));

