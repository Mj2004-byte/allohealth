export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  location: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  inventory: WarehouseStock[];
  totalAvailable: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface ReservationWithDetails {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'released' | 'expired';
  expiresAt: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    category: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
