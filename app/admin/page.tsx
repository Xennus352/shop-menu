"use client";

import { useState, useEffect, useRef } from "react";
import { colors } from "@/constant/themes";
import {
  createCategory,
  deleteCategory,
  getCategories,
} from "../actions/categoryActions";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  toggleItemAvailabilityAction,
  updateMenuItem,
  uploadMenuItemImage,
} from "../actions/menuItemActions";

// Matching your real Database Schema shapes
interface DbCategory {
  id: string;
  name: string;
  name_en: string | null;
  display_order: number;
  created_at: string;
}

interface DbMenuItem {
  id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  price: number;
  foodUrl: string | null;
  description: string | null;
  is_available: boolean;
  stock_status: "instock" | "low" | "outofstock";
  is_daily_special: boolean;
  created_at: string;
}

export default function AdminPanel() {
  // Real DB States
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingItem, setEditingItem] = useState<DbMenuItem | null>(null);

  // Image upload states with preview
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Forms local states
  const [newItem, setNewItem] = useState({
    name: "",
    name_en: "",
    price: "",
    description: "",
    category_id: "",
    is_available: true,
    stock_status: "instock" as "instock" | "low" | "outofstock",
    is_daily_special: false,
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    name_en: "",
    display_order: "0",
  });

  const [message, setMessage] = useState({ text: "", isSuccess: true });
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");

  // Fetch initial data from DB
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedCats, fetchedItems] = await Promise.all([
        getCategories(),
        getMenuItems(),
      ]);
      setCategories(fetchedCats || []);
      setItems(fetchedItems || []);

      if (fetchedCats && fetchedCats.length > 0 && !newItem.category_id) {
        setNewItem((prev) => ({ ...prev, category_id: fetchedCats[0].id }));
      }
    } catch (err: any) {
      showMessage(err.message || "Failed to sync database data", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showMessage = (msg: string, isSuccess: boolean = true) => {
    setMessage({ text: msg, isSuccess });
    setTimeout(() => setMessage({ text: "", isSuccess: true }), 4000);
  };

  // Handle image file selection with preview
  const handleAddImageSelect = (file: File | null) => {
    setAddImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAddImagePreview(null);
    }
  };

  const handleEditImageSelect = (file: File | null) => {
    setEditImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setEditImagePreview(null);
    }
  };

  // Category DB Actions
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showMessage("Please enter a category name", false);
      return;
    }

    const res = await createCategory({
      name: newCategory.name,
      name_en: newCategory.name_en.trim() ? newCategory.name_en : null,
      display_order: Number(newCategory.display_order) || 0,
    });

    if (!res.success) {
      showMessage(res.error || "Failed to create category", false);
      return;
    }

    showMessage("Category created successfully!");
    setNewCategory({ name: "", name_en: "", display_order: "0" });
    loadDashboardData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Are you sure? This will delete all items tied to this category.",
      )
    )
      return;

    const res = await deleteCategory(id);
    if (!res.success) {
      showMessage(res.error || "Failed to delete category", false);
      return;
    }

    showMessage("Category deleted successfully!");
    loadDashboardData();
  };

  // Menu Item DB Actions
  const handleAddItem = async () => {
    const calculatedPrice = Number(newItem.price);
    if (
      !newItem.name.trim() ||
      isNaN(calculatedPrice) ||
      calculatedPrice <= 0
    ) {
      showMessage("Please fill in a valid item name and price", false);
      return;
    }
    if (!newItem.category_id) {
      showMessage("Please select or create a category first", false);
      return;
    }

    try {
      setUploading(true);
      let foodUrl: string | null = null;

      // Handle Storage upload if a file was selected
      if (addImageFile) {
        const formData = new FormData();
        formData.append("file", addImageFile);
        const uploadRes = await uploadMenuItemImage(formData);

        if (!uploadRes.success) {
          showMessage(uploadRes.error || "Image upload failed", false);
          setUploading(false);
          return;
        }
        foodUrl = uploadRes.url || null;
      }

      const res = await createMenuItem({
        category_id: newItem.category_id,
        name: newItem.name,
        name_en: newItem.name_en.trim() ? newItem.name_en : null,
        price: calculatedPrice,
        description: newItem.description.trim() ? newItem.description : null,
        is_available: newItem.is_available,
        stock_status: newItem.stock_status,
        is_daily_special: newItem.is_daily_special,
        foodUrl: foodUrl,
      });

      if (!res.success) {
        showMessage(res.error || "Error adding item", false);
        return;
      }

      showMessage("Item added successfully!");
      setNewItem({
        name: "",
        name_en: "",
        price: "",
        description: "",
        category_id: categories[0]?.id || "",
        is_available: true,
        stock_status: "instock",
        is_daily_special: false,
      });
      setAddImageFile(null);
      setAddImagePreview(null);
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      loadDashboardData();
    } catch (err: any) {
      showMessage("An unexpected error occurred", false);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    if (!editingItem.name.trim() || editingItem.price <= 0) {
      showMessage("Please enter a valid name and price", false);
      return;
    }

    try {
      setUploading(true);
      let foodUrl: string | null = editingItem.foodUrl;

      // Handle Storage upload if a new replacement image file was specified
      if (editImageFile) {
        const formData = new FormData();
        formData.append("file", editImageFile);
        const uploadRes = await uploadMenuItemImage(formData);

        if (!uploadRes.success) {
          showMessage(uploadRes.error || "Image upload failed", false);
          setUploading(false);
          return;
        }
        foodUrl = uploadRes.url || null;
      }

      const res = await updateMenuItem(editingItem.id, {
        category_id: editingItem.category_id,
        name: editingItem.name,
        name_en: editingItem.name_en?.trim() ? editingItem.name_en : null,
        price: Number(editingItem.price),
        description: editingItem.description?.trim()
          ? editingItem.description
          : null,
        is_available: editingItem.is_available,
        stock_status: editingItem.stock_status,
        is_daily_special: editingItem.is_daily_special,
        foodUrl: foodUrl,
      });

      if (!res.success) {
        showMessage(res.error || "Error updating item", false);
        return;
      }

      setEditingItem(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      showMessage("Item updated successfully!");
      loadDashboardData();
    } catch (err: any) {
      showMessage("An unexpected error occurred", false);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const res = await toggleItemAvailabilityAction(id);
    if (!res.success) {
      showMessage(res.error || "Could not toggle availability", false);
      return;
    }
    showMessage("Availability updated!");
    loadDashboardData();
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    const res = await deleteMenuItem(id);
    if (!res.success) {
      showMessage(res.error || "Failed to delete item", false);
      return;
    }
    showMessage("Item removed from database.");
    loadDashboardData();
  };

  return (
    <div style={{ backgroundColor: colors.cream, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        {/* Toast Notification */}
        {message.text && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-sm transition-all max-w-[90vw] sm:max-w-sm ${
              message.isSuccess ? "bg-green-600" : "bg-red-600"
            }`}
            style={{ color: colors.textLight }}
          >
            {message.text}
          </div>
        )}

        {/* Header */}
        <div
          className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6"
          style={{ borderColor: colors.olive }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-light"
                style={{ color: colors.textDark }}
              >
                Admin Dashboard
              </h1>
              <p
                className="text-xs sm:text-sm mt-1"
                style={{ color: colors.olive }}
              >
                Live Database Connected Menu Manager
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm"
              style={{ color: colors.olive }}
            >
              <span>{categories.length} categories</span>
              <span className="hidden xs:inline">•</span>
              <span>{items.length} items</span>
              {(loading || uploading) && (
                <span className="animate-pulse text-xs text-amber-700 font-bold ml-1 sm:ml-2">
                  {uploading ? "Uploading Image..." : "Syncing..."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="border-b mb-4 sm:mb-6 overflow-x-auto"
          style={{ borderColor: colors.olive }}
        >
          <nav className="flex gap-4 sm:gap-6 min-w-max">
            {(["items", "categories"] as const).map((tab) => {
              const labels = { items: "Menu Items", categories: "Categories" };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 sm:py-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2"
                      : "border-transparent hover:border-opacity-50"
                  }`}
                  style={{
                    color: activeTab === tab ? colors.textDark : colors.olive,
                    borderColor:
                      activeTab === tab ? colors.textDark : "transparent",
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Tabs */}
        <div className="py-1 sm:py-2">
          {activeTab === "items" && (
            <div className="space-y-6 sm:space-y-8">
              {/* Add Item Form */}
              <div
                className="bg-white p-3 sm:p-4 rounded border"
                style={{ borderColor: colors.sage }}
              >
                <h3
                  className="text-sm font-medium mb-3 sm:mb-4"
                  style={{ color: colors.textDark }}
                >
                  Add New Item
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  <input
                    type="text"
                    placeholder="Name (Myanmar)"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />
                  <input
                    type="text"
                    placeholder="Name (English) - Optional"
                    value={newItem.name_en}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name_en: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />
                  <input
                    type="number"
                    placeholder="Price (MMK)"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />

                  <select
                    value={newItem.category_id}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category_id: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  >
                    {categories.length === 0 && (
                      <option value="">-- Create a Category First --</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />

                  <select
                    value={newItem.stock_status}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        stock_status: e.target.value as any,
                      })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  >
                    <option value="instock">In Stock (ပစ္စည်းရှိ)</option>
                    <option value="low">Low Stock (နည်းနေသည်)</option>
                    <option value="outofstock">Out Of Stock (ပြတ်နေသည်)</option>
                  </select>

                  {/* Image Upload with Preview */}
                  <div className="xs:col-span-2 lg:col-span-3">
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Food Item Image (ဓါတ်ပုံ)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={addFileInputRef}
                        onChange={(e) =>
                          handleAddImageSelect(e.target.files?.[0] || null)
                        }
                        className="text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 w-full sm:w-auto"
                      />
                      {addImagePreview && (
                        <div className="flex items-center gap-2">
                          <img
                            src={addImagePreview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border border-gray-200"
                          />
                          <button
                            onClick={() => {
                              setAddImageFile(null);
                              setAddImagePreview(null);
                              if (addFileInputRef.current)
                                addFileInputRef.current.value = "";
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-1 col-span-1 xs:col-span-2 lg:col-span-3 py-1">
                    <label
                      className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                      style={{ color: colors.textDark }}
                    >
                      <input
                        type="checkbox"
                        checked={newItem.is_available}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            is_available: e.target.checked,
                          })
                        }
                      />
                      Available on Menu (ပြသမည်)
                    </label>
                    <label
                      className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                      style={{ color: colors.textDark }}
                    >
                      <input
                        type="checkbox"
                        checked={newItem.is_daily_special}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            is_daily_special: e.target.checked,
                          })
                        }
                      />
                      Daily Special (ယနေ့အထူး)
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={uploading}
                  className="mt-3 px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 w-full sm:w-auto"
                  style={{
                    backgroundColor: colors.sage,
                    color: colors.textLight,
                  }}
                >
                  {uploading ? "Saving data..." : "Add to Menu List"}
                </button>
              </div>

              {/* Edit Item Form */}
              {editingItem && (
                <div
                  className="bg-amber-50/50 p-3 sm:p-4 rounded border-2 border-dashed"
                  style={{ borderColor: colors.olive }}
                >
                  <h3
                    className="text-sm font-medium mb-3 sm:mb-4"
                    style={{ color: colors.textDark }}
                  >
                    Edit Item Properties
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    />
                    <input
                      type="text"
                      value={editingItem.name_en || ""}
                      placeholder="English Name"
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          name_en: e.target.value,
                        })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    />
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          price: Number(e.target.value),
                        })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    />

                    <select
                      value={editingItem.category_id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          category_id: e.target.value,
                        })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={editingItem.description || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    />

                    <select
                      value={editingItem.stock_status}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          stock_status: e.target.value as any,
                        })
                      }
                      className="px-3 py-2 border rounded text-sm w-full"
                      style={{
                        borderColor: colors.sage,
                        color: colors.textDark,
                      }}
                    >
                      <option value="instock">In Stock</option>
                      <option value="low">Low Stock</option>
                      <option value="outofstock">Out Of Stock</option>
                    </select>

                    {/* Edit Image Upload with Preview */}
                    <div className="xs:col-span-2 lg:col-span-3">
                      <label className="text-xs font-medium text-gray-500 block mb-1">
                        Replace Food Image (ဓါတ်ပုံအသစ်လဲရန်) - Optional
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          {editingItem.foodUrl && !editImagePreview && (
                            <img
                              src={editingItem.foodUrl}
                              alt="Current layout preview"
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          {editImagePreview && (
                            <img
                              src={editImagePreview}
                              alt="New preview"
                              className="w-12 h-12 object-cover rounded border border-green-500"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={editFileInputRef}
                            onChange={(e) =>
                              handleEditImageSelect(e.target.files?.[0] || null)
                            }
                            className="text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 w-full sm:w-auto"
                          />
                        </div>
                        {editImagePreview && (
                          <button
                            onClick={() => {
                              setEditImageFile(null);
                              setEditImagePreview(null);
                              if (editFileInputRef.current)
                                editFileInputRef.current.value = "";
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove New Image
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 col-span-1 xs:col-span-2 lg:col-span-3 py-1">
                      <label
                        className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                        style={{ color: colors.textDark }}
                      >
                        <input
                          type="checkbox"
                          checked={editingItem.is_available}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              is_available: e.target.checked,
                            })
                          }
                        />
                        Available
                      </label>
                      <label
                        className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                        style={{ color: colors.textDark }}
                      >
                        <input
                          type="checkbox"
                          checked={editingItem.is_daily_special}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              is_daily_special: e.target.checked,
                            })
                          }
                        />
                        Daily Special (ယနေ့အထူး)
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button
                      onClick={handleUpdateItem}
                      disabled={uploading}
                      className="px-4 py-2 text-sm font-medium rounded text-white disabled:opacity-50 w-full sm:w-auto"
                      style={{
                        backgroundColor: colors.sage,
                      }}
                    >
                      {uploading
                        ? "Uploading image..."
                        : "Save Menu List Record"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setEditImageFile(null);
                        setEditImagePreview(null);
                      }}
                      className="px-4 py-2 text-sm text-black font-medium rounded bg-white border border-red-300 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Items Table Grid - Responsive */}
              <div
                className="border rounded overflow-hidden"
                style={{ borderColor: colors.sage }}
              >
                {/* Mobile Card View */}
                <div
                  className="sm:hidden divide-y"
                  style={{ borderColor: colors.sage }}
                >
                  {items.map((item) => (
                    <div key={item.id} className="p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className="text-xs font-semibold px-2 py-1 rounded shadow-sm flex-shrink-0"
                          style={{
                            backgroundColor: item.is_available
                              ? colors.sage
                              : colors.darkPeach,
                            color: colors.textLight,
                          }}
                        >
                          {item.is_available ? "✅ ရှိ" : "❌ မရှိ"}
                        </button>
                        {item.foodUrl ? (
                          <img
                            src={item.foodUrl}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm truncate"
                            style={{ color: colors.textDark }}
                          >
                            {item.name}
                          </div>
                          {item.name_en && (
                            <div className="text-xs text-gray-400 truncate">
                              {item.name_en}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span
                              className="text-xs font-medium"
                              style={{ color: colors.textDark }}
                            >
                              {item.price} MMK
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              {categories.find(
                                (cat) => cat.id === item.category_id,
                              )?.name || "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span
                              className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                item.stock_status === "instock"
                                  ? "bg-green-100 text-green-800"
                                  : item.stock_status === "low"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.stock_status}
                            </span>
                            {item.is_daily_special && (
                              <span className="text-[10px] font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                ✨ ယနေ့အထူး
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{
                              color: colors.olive,
                              backgroundColor: colors.cream,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{
                              color: colors.darkPeach,
                              backgroundColor: colors.cream,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: colors.sage }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Stock / Tags
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y bg-white"
                      style={{ borderColor: colors.sage }}
                    >
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleAvailability(item.id)}
                              className="text-xs font-semibold px-2.5 py-1 rounded shadow-sm"
                              style={{
                                backgroundColor: item.is_available
                                  ? colors.sage
                                  : colors.darkPeach,
                                color: colors.textLight,
                              }}
                            >
                              {item.is_available ? "✅ ရှိ" : "❌ မရှိ"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {item.foodUrl ? (
                              <img
                                src={item.foodUrl}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded border bg-gray-50"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div
                              className="font-medium"
                              style={{ color: colors.textDark }}
                            >
                              {item.name}
                            </div>
                            {item.name_en && (
                              <div className="text-xs text-gray-400 font-mono">
                                {item.name_en}
                              </div>
                            )}
                          </td>
                          <td
                            className="px-4 py-3 text-xs font-medium"
                            style={{ color: colors.textDark }}
                          >
                            {categories.find(
                              (cat) => cat.id === item.category_id,
                            )?.name || "—"}
                          </td>
                          <td
                            className="px-4 py-3 font-medium"
                            style={{ color: colors.textDark }}
                          >
                            {item.price} MMK
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <span
                              className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded block w-max ${
                                item.stock_status === "instock"
                                  ? "bg-green-100 text-green-800"
                                  : item.stock_status === "low"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.stock_status}
                            </span>
                            {item.is_daily_special && (
                              <span className="text-[10px] font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded block w-max">
                                ✨ ယနေ့အထူး
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="text-sm font-medium"
                                style={{ color: colors.olive }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteItem(item.id, item.name)
                                }
                                className="text-sm font-medium"
                                style={{ color: colors.darkPeach }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-6">
              <div
                className="bg-white p-3 sm:p-4 rounded border"
                style={{ borderColor: colors.sage }}
              >
                <h3
                  className="text-sm font-medium mb-3 sm:mb-4"
                  style={{ color: colors.textDark }}
                >
                  Create New Category
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-w-2xl">
                  <input
                    type="text"
                    placeholder="Name (Myanmar)"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />
                  <input
                    type="text"
                    placeholder="Name (English)"
                    value={newCategory.name_en}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name_en: e.target.value,
                      })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />
                  <input
                    type="number"
                    placeholder="Sort Order"
                    value={newCategory.display_order}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        display_order: e.target.value,
                      })
                    }
                    className="px-3 py-2 border rounded text-sm w-full"
                    style={{ borderColor: colors.sage, color: colors.textDark }}
                  />
                </div>
                <button
                  onClick={handleAddCategory}
                  className="mt-3 px-4 py-2 text-sm font-medium rounded text-white w-full sm:w-auto"
                  style={{ backgroundColor: colors.sage }}
                >
                  Save Category
                </button>
              </div>

              {/* Categories Table - Responsive */}
              <div
                className="border rounded overflow-hidden max-w-2xl"
                style={{ borderColor: colors.sage }}
              >
                {/* Mobile Card View */}
                <div
                  className="sm:hidden divide-y"
                  style={{ borderColor: colors.sage }}
                >
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div
                            className="font-medium text-sm"
                            style={{ color: colors.textDark }}
                          >
                            {cat.name}
                          </div>
                          {cat.name_en && (
                            <div className="text-xs text-gray-500 font-mono">
                              {cat.name_en}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Order: {cat.display_order}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-sm font-medium px-3 py-1 rounded"
                          style={{
                            color: colors.darkPeach,
                            backgroundColor: colors.cream,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: colors.sage }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          Myanmar Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">
                          English Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white">
                          Order
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y bg-white"
                      style={{ borderColor: colors.sage }}
                    >
                      {categories.map((cat) => (
                        <tr key={cat.id}>
                          <td
                            className="px-4 py-3 font-medium"
                            style={{ color: colors.textDark }}
                          >
                            {cat.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                            {cat.name_en || "—"}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600 font-bold">
                            {cat.display_order}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-xs font-semibold"
                              style={{ color: colors.darkPeach }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
