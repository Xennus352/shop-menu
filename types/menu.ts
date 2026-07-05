export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  available: boolean;
  description: string;
  categoryId: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  order: number;
}

export interface StockStatus {
  [key: string]: string;
  lastUpdated: string;
}

export interface DailySpecial {
  name: string;
  description: string;
  available: boolean;
  date?: string;
}

export interface MenuData {
  categories: Category[];
  items: MenuItem[];
  dailySpecial: DailySpecial;
  stock: StockStatus;
}

export interface CartItem extends MenuItem {
  quantity: number;
}