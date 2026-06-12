export interface IUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'waiter' | 'customer' | 'head_chef' | 'pastry_chef';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategory {
  id: number;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IArticle {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  image?: string;
  price: number;
  active: boolean;
  chefRole?: 'head_chef' | 'pastry_chef' | null;
  Category?: ICategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITable {
  id: number;
  tableNumber: number;
  qrCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderItem {
  id: number;
  orderId: number;
  articleId: number;
  quantity: number;
  Article?: IArticle;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrder {
  id: number;
  tableId: number;
  status: 'pending' | 'in_progress' | 'served' | 'completed';
  assignedWaiterId?: number;
  Table?: ITable;
  Waiter?: IUser;
  OrderItems?: IOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface INotificationMetadata {
  tableNumber?: number;
  tableId?: number;
  zoneName?: string | null;
  zoneId?: number | null;
  needsDispatch?: boolean;
}

export interface INotification {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  type?: string;
  metadata?: INotificationMetadata | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IZone {
  id: number;
  name: string;
  description?: string | null;
  Tables?: { id: number; tableNumber: number }[];
  Waiters?: { id: number; name: string; email: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IKitchenTicket {
  id: number;
  orderId: number;
  chefRole: 'head_chef' | 'pastry_chef';
  status: 'pending' | 'cooking' | 'ready';
  tableNumber: number;
  Order?: {
    id: number;
    tableId: number;
    assignedWaiterId?: number;
    Table?: { tableNumber: number };
    OrderItems?: {
      id: number;
      quantity: number;
      Article?: { id: number; name: string; price: number; chefRole?: string };
    }[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: 'admin' | 'waiter' | 'customer';
}
