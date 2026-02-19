import { create } from 'zustand';
import { Table, Order, TableStatus, OrderStatus, OrderWithItems } from '@/lib/types';

interface TableOrderStore {
  tables: Table[];
  orders: Order[];
  setTables: (tables: Table[]) => void;
  setOrders: (orders: Order[]) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  addOrder: (order: Order | OrderWithItems) => void;
  removeOrder: (orderId: string) => void;
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

  removeOrder: (orderId) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      const newOrders = state.orders.filter((o) => o.id !== orderId);
      const newTables = [...state.tables];

      // If it was a DINE_IN order, revert table to EMPTY only if no other active order holds it
      if (order && order.table_id && order.order_type === 'DINE_IN') {
        const otherActiveOrder = newOrders.find(
          (o) => o.table_id === order.table_id && o.order_type === 'DINE_IN' &&
            o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
        );
        if (!otherActiveOrder) {
          const tableIndex = newTables.findIndex((t) => t.id === order.table_id);
          if (tableIndex !== -1) {
            newTables[tableIndex] = { ...newTables[tableIndex], status: TableStatus.EMPTY };
          }
        }
      }

      return { orders: newOrders, tables: newTables };
    });
  },

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
          } else {
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

      const updatedOrder = { ...order, status: OrderStatus.COMPLETED };
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

