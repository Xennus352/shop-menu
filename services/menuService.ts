import {
  MenuData,
  MenuItem,
  Category,
  DailySpecial,
  StockStatus,
} from "@/types/menu";

const STORAGE_KEY = "menu_data";
const INITIAL_DATA: MenuData = {
  categories: [
    { id: "main", name: "အဓိက ဟင်းလျာများ", nameEn: "Main Dishes", order: 1 },
    {
      id: "sides",
      name: "ဘေးထွက်ဟင်းလျာများ",
      nameEn: "Side Dishes",
      order: 2,
    },
    { id: "drinks", name: "အအေး / အချိုရည်", nameEn: "Drinks", order: 3 },
  ],
  items: [
    {
      id: "apu-lua-pu",
      name: "အာပူလျှာပူ",
      nameEn: "Apu Lua Pu",
      price: 1500,
      available: true,
      description: "အရသာရှိသော အာပူလျှာပူ",
      categoryId: "main",
    },
    {
      id: "apu-soup",
      name: "အာပူသုပ်",
      nameEn: "Apu Soup",
      price: 2000,
      available: true,
      description: "အာပူသုပ်",
      categoryId: "main",
    },
    {
      id: "fried-roll",
      name: "ဖက်ထုပ်ကြော်",
      nameEn: "Fried Roll",
      price: 1500,
      available: true,
      description: "ကြော်ထားသော ဖက်ထုပ်",
      categoryId: "main",
    },
    {
      id: "myanmar-satay",
      name: "မြန်မာတုတ်ထိုး",
      nameEn: "Myanmar Satay",
      price: 2500,
      available: true,
      description: "မြန်မာ့ရိုးရာ တုတ်ထိုး",
      categoryId: "main",
    },
    {
      id: "korean-grill",
      name: "ကိုရီးယားကင်",
      nameEn: "Korean Grill",
      price: 3000,
      available: true,
      description: "ကိုရီးယားစတိုင် ကင်",
      categoryId: "main",
    },
    {
      id: "steamed-egg",
      name: "ကြက်ဥပေါင်း",
      nameEn: "Steamed Egg",
      price: 1500,
      available: true,
      description: "ပူပူနွေးနွေး ကြက်ဥပေါင်း",
      categoryId: "main",
    },
    {
      id: "chicken-meatball",
      name: "ကြက်ကြောလုံးပေါင်း",
      nameEn: "Chicken Meatball",
      price: 2500,
      available: true,
      description: "ကြက်ကြောလုံးပေါင်း",
      categoryId: "main",
    },
    {
      id: "mala-noodle",
      name: "မာလာရှမ်းကော",
      nameEn: "Mala Noodle",
      price: 3000,
      available: true,
      description: "မာလာအရသာရှိသော ရှမ်းကော",
      categoryId: "main",
    },
    {
      id: "fried-vermicelli",
      name: "ကြာဇံကြော်",
      nameEn: "Fried Vermicelli",
      price: 2000,
      available: true,
      description: "ကြာဇံကြော်",
      categoryId: "main",
    },
    {
      id: "mala-chicken-leg",
      name: "ကြက်ခြေထောက်မာလာ",
      nameEn: "Mala Chicken Leg",
      price: 3500,
      available: false,
      description: "မာလာအရသာရှိသော ကြက်ခြေထောက် (ရတစ်ရက်မရတစ်ရက်)",
      categoryId: "main",
    },
    {
      id: "steamed-chicken",
      name: "ကြက်သားပေါင်း",
      nameEn: "Steamed Chicken",
      price: 2500,
      available: true,
      description: "ပူပူနွေးနွေး ကြက်သားပေါင်း",
      categoryId: "main",
    },
    {
      id: "fried-spring-roll",
      name: "ဖက်ထုပ်ကြော်",
      nameEn: "Fried Spring Roll",
      price: 1500,
      available: true,
      description: "ကြွပ်ကြွပ်ရွရွ ဖက်ထုပ်ကြော်",
      categoryId: "sides",
    },
    {
      id: "bean-pancake",
      name: "ပဲပြားအစာသွပ်",
      nameEn: "Bean Pancake",
      price: 2000,
      available: true,
      description: "ပဲပြားအစာသွပ်",
      categoryId: "sides",
    },
    {
      id: "cold-drinks",
      name: "အအေး/ အချိုရည်",
      nameEn: "Cold Drinks",
      price: 1000,
      available: true,
      description: "အအေးအချိုရည်အမျိုးမျိုး",
      categoryId: "drinks",
    },
  ],
  dailySpecial: {
    name: "ငါးထမင်းစိမ့်",
    description: "တစ်ခါတစ်လေရ",
    available: false,
    date: "2026-07-02",
  },
  stock: {
    ဖက်ထုပ်ကြော်: "ကုန်နေပြီ",
    ပဲပြားအစာသွပ်: "ရှိသေးတယ်",
    ကြက်ကြောလုံးပေါင်း: "ရှိသေးတယ်",
    lastUpdated: "2026-07-02 18:45",
  },
};

class MenuService {
  private getData(): MenuData {
    if (typeof window === "undefined") return INITIAL_DATA;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      this.saveData(INITIAL_DATA);
      return INITIAL_DATA;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_DATA;
    }
  }

  private saveData(data: MenuData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Get all menu data
  getMenuData(): MenuData {
    return this.getData();
  }

  // Get all items
  getItems(): MenuItem[] {
    return this.getData().items;
  }

  // Get items by category
  getItemsByCategory(categoryId: string): MenuItem[] {
    return this.getData().items.filter(
      (item) => item.categoryId === categoryId,
    );
  }

  // Get available items
  getAvailableItems(): MenuItem[] {
    return this.getData().items.filter((item) => item.available);
  }

  // Get categories
  getCategories(): Category[] {
    return this.getData().categories.sort((a, b) => a.order - b.order);
  }

  // CRUD for items
  addItem(item: Omit<MenuItem, "id">): MenuItem {
    const data = this.getData();
    const newItem: MenuItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    data.items.push(newItem);
    this.saveData(data);
    return newItem;
  }

  updateItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const data = this.getData();
    const index = data.items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    data.items[index] = { ...data.items[index], ...updates };
    this.saveData(data);
    return data.items[index];
  }

  deleteItem(id: string): boolean {
    const data = this.getData();
    const filtered = data.items.filter((item) => item.id !== id);
    if (filtered.length === data.items.length) return false;

    data.items = filtered;
    this.saveData(data);
    return true;
  }

  toggleAvailability(id: string): MenuItem | null {
    const data = this.getData();
    const item = data.items.find((item) => item.id === id);
    if (!item) return null;

    item.available = !item.available;
    this.saveData(data);
    return item;
  }

  // CRUD for categories
  addCategory(name: string, nameEn?: string): Category {
    const data = this.getData();
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name,
      nameEn: nameEn || name,
      order: data.categories.length + 1,
    };
    data.categories.push(newCategory);
    this.saveData(data);
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const data = this.getData();
    const index = data.categories.findIndex((cat) => cat.id === id);
    if (index === -1) return null;

    data.categories[index] = { ...data.categories[index], ...updates };
    this.saveData(data);
    return data.categories[index];
  }

  deleteCategory(id: string): boolean {
    const data = this.getData();
    // Check if category has items
    const hasItems = data.items.some((item) => item.categoryId === id);
    if (hasItems) return false; // Can't delete category with items

    const filtered = data.categories.filter((cat) => cat.id !== id);
    if (filtered.length === data.categories.length) return false;

    data.categories = filtered;
    this.saveData(data);
    return true;
  }

  // Update stock status
  updateStock(key: string, value: string): void {
    const data = this.getData();
    data.stock[key] = value;
    data.stock.lastUpdated = new Date().toLocaleString();
    this.saveData(data);
  }

  // Update daily special
  updateDailySpecial(updates: Partial<DailySpecial>): DailySpecial {
    const data = this.getData();
    data.dailySpecial = { ...data.dailySpecial, ...updates };
    if (updates.available !== undefined && updates.available === true) {
      data.dailySpecial.date = new Date().toISOString().split("T")[0];
    }
    this.saveData(data);
    return data.dailySpecial;
  }

  // Export data as JSON
  exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  // Import data from JSON
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      // Validate data structure
      if (!data.categories || !data.items || !data.stock) {
        throw new Error("Invalid data structure");
      }
      this.saveData(data);
      return true;
    } catch {
      return false;
    }
  }

  // Reset to initial data
  resetData(): void {
    this.saveData(INITIAL_DATA);
  }
}

export const menuService = new MenuService();
