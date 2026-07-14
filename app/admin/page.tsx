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
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingItem, setEditingItem] = useState<DbMenuItem | null>(null);

  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        {/* Toast Notification */}
        {message.text && (
          <div
            className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm transition-all max-w-[90vw] sm:max-w-sm neu-card flex items-center gap-2"
            style={{ color: message.isSuccess ? "#2D6A4F" : "#9B1D1D" }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: message.isSuccess ? "#2D6A4F" : "#9B1D1D",
              }}
            />
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: colors.textDark }}
              >
                Admin Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.muted }}>
                Live Database Connected Menu Manager
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-3 text-sm"
              style={{ color: colors.muted }}
            >
              <span className="font-medium">{categories.length} categories</span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.muted }} />
              <span className="font-medium">{items.length} items</span>
              {(loading || uploading) && (
                <span
                  className="text-xs font-bold ml-1 animate-pulse"
                  style={{ color: colors.darkPeach }}
                >
                  {uploading ? "Uploading Image..." : "Syncing..."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 p-1 rounded-xl" style={{ background: colors.bg, boxShadow: "inset 2px 2px 4px #D4CCC0, inset -2px -2px 4px #FFFFFF" }}>
          {(["items", "categories"] as const).map((tab) => {
            const labels = { items: "Menu Items", categories: "Categories" };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 sm:flex-none ${
                  isActive ? "" : ""
                }`}
                style={{
                  color: isActive ? "white" : colors.textDark,
                  background: isActive ? colors.olive : "transparent",
                  boxShadow: isActive
                    ? `0 2px 8px ${colors.olive}40`
                    : "none",
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        <div className="py-1 sm:py-2">
          {activeTab === "items" && (
            <div className="space-y-8">
              {/* Add Item Form */}
              <div className="p-5 sm:p-6 rounded-2xl neu-card">
                <h3
                  className="text-sm font-bold mb-5 tracking-wide uppercase"
                  style={{ color: colors.muted }}
                >
                  Add New Item
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="Name (Myanmar)"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
                  />
                  <input
                    type="text"
                    placeholder="Name (English) - Optional"
                    value={newItem.name_en}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name_en: e.target.value })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
                  />
                  <input
                    type="number"
                    placeholder="Price (MMK)"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: e.target.value })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
                  />

                  <select
                    value={newItem.category_id}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category_id: e.target.value })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full appearance-none"
                    style={{ color: colors.textDark }}
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
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
                  />

                  <select
                    value={newItem.stock_status}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        stock_status: e.target.value as any,
                      })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full appearance-none"
                    style={{ color: colors.textDark }}
                  >
                    <option value="instock">In Stock (ပစ္စည်းရှိ)</option>
                    <option value="low">Low Stock (နည်းနေသည်)</option>
                    <option value="outofstock">Out Of Stock (ပြတ်နေသည်)</option>
                  </select>

                  {/* Image Upload */}
                  <div className="xs:col-span-2 lg:col-span-3">
                    <label className="text-xs font-medium block mb-2" style={{ color: colors.muted }}>
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
                        className="text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50 w-full sm:w-auto neu-button"
                        style={{ color: colors.textDark }}
                      />
                      {addImagePreview && (
                        <div className="flex items-center gap-2">
                          <img
                            src={addImagePreview}
                            alt="Preview"
                            className="w-14 h-14 object-cover rounded-xl neu-card"
                          />
                          <button
                            onClick={() => {
                              setAddImageFile(null);
                              setAddImagePreview(null);
                              if (addFileInputRef.current)
                                addFileInputRef.current.value = "";
                            }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ color: "#9B1D1D", background: "#FEF2F2" }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 col-span-1 xs:col-span-2 lg:col-span-3 pt-1">
                    <label
                      className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
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
                        className="w-4 h-4 rounded"
                        style={{ accentColor: colors.olive }}
                      />
                      Available on Menu (ပြသမည်)
                    </label>
                    <label
                      className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
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
                        className="w-4 h-4 rounded"
                        style={{ accentColor: colors.olive }}
                      />
                      Daily Special (ယနေ့အထူး)
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={uploading}
                  className="mt-5 px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 w-full sm:w-auto"
                  style={{
                    background: `linear-gradient(135deg, ${colors.sage}, ${colors.olive})`,
                    color: "white",
                    boxShadow: `0 4px 12px ${colors.olive}40`,
                  }}
                >
                  {uploading ? "Saving data..." : "Add to Menu List"}
                </button>
              </div>

              {/* Edit Item Form */}
              {editingItem && (
                <div className="p-5 sm:p-6 rounded-2xl neu-card border-2 border-dashed" style={{ borderColor: `${colors.olive}40` }}>
                  <h3
                    className="text-sm font-bold mb-5 tracking-wide uppercase"
                    style={{ color: colors.muted }}
                  >
                    Edit Item Properties
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                      style={{ color: colors.textDark }}
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
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                      style={{ color: colors.textDark }}
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
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                      style={{ color: colors.textDark }}
                    />

                    <select
                      value={editingItem.category_id}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          category_id: e.target.value,
                        })
                      }
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full appearance-none"
                      style={{ color: colors.textDark }}
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
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                      style={{ color: colors.textDark }}
                    />

                    <select
                      value={editingItem.stock_status}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          stock_status: e.target.value as any,
                        })
                      }
                      className="neu-input px-4 py-2.5 rounded-xl text-sm w-full appearance-none"
                      style={{ color: colors.textDark }}
                    >
                      <option value="instock">In Stock</option>
                      <option value="low">Low Stock</option>
                      <option value="outofstock">Out Of Stock</option>
                    </select>

                    {/* Edit Image Upload */}
                    <div className="xs:col-span-2 lg:col-span-3">
                      <label className="text-xs font-medium block mb-2" style={{ color: colors.muted }}>
                        Replace Food Image (ဓါတ်ပုံအသစ်လဲရန်) - Optional
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          {editingItem.foodUrl && !editImagePreview && (
                            <img
                              src={editingItem.foodUrl}
                              alt="Current layout preview"
                              className="w-12 h-12 object-cover rounded-xl neu-card"
                            />
                          )}
                          {editImagePreview && (
                            <img
                              src={editImagePreview}
                              alt="New preview"
                              className="w-12 h-12 object-cover rounded-xl neu-card"
                              style={{ boxShadow: `0 0 0 2px ${colors.sage}` }}
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={editFileInputRef}
                            onChange={(e) =>
                              handleEditImageSelect(e.target.files?.[0] || null)
                            }
                            className="text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50 w-full sm:w-auto neu-button"
                            style={{ color: colors.textDark }}
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
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ color: "#9B1D1D", background: "#FEF2F2" }}
                          >
                            Remove New Image
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 col-span-1 xs:col-span-2 lg:col-span-3 pt-1">
                      <label
                        className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
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
                          className="w-4 h-4 rounded"
                          style={{ accentColor: colors.olive }}
                        />
                        Available
                      </label>
                      <label
                        className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
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
                          className="w-4 h-4 rounded"
                          style={{ accentColor: colors.olive }}
                        />
                        Daily Special (ယနေ့အထူး)
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      onClick={handleUpdateItem}
                      disabled={uploading}
                      className="px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${colors.sage}, ${colors.olive})`,
                        color: "white",
                        boxShadow: `0 4px 12px ${colors.olive}40`,
                      }}
                    >
                      {uploading ? "Uploading image..." : "Save Menu List Record"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setEditImageFile(null);
                        setEditImagePreview(null);
                      }}
                      className="px-6 py-2.5 text-sm font-medium rounded-xl neu-button"
                      style={{ color: colors.textDark }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="rounded-2xl neu-card overflow-hidden">
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y" style={{ borderColor: `${colors.muted}20` }}>
                  {items.map((item) => (
                    <div key={item.id} className="p-4" style={{ background: colors.surface }}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg neu-button flex-shrink-0"
                          style={{
                            color: item.is_available ? "#2D6A4F" : "#9B1D1D",
                            background: item.is_available ? "#ECFDF5" : "#FEF2F2",
                            boxShadow: "none",
                          }}
                        >
                          {item.is_available ? "ရှိ" : "မရှိ"}
                        </button>
                        {item.foodUrl ? (
                          <img
                            src={item.foodUrl}
                            alt={item.name}
                            className="w-11 h-11 object-cover rounded-xl flex-shrink-0"
                            style={{ boxShadow: "2px 2px 4px #D4CCC0" }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[10px] flex-shrink-0" style={{ background: colors.bg, color: colors.muted }}>
                            No Img
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm" style={{ color: colors.textDark }}>
                            {item.name}
                          </div>
                          {item.name_en && (
                            <div className="text-xs" style={{ color: colors.muted }}>
                              {item.name_en}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-xs font-semibold" style={{ color: colors.textDark }}>
                              {item.price} MMK
                            </span>
                            <span className="text-xs" style={{ color: colors.muted }}>•</span>
                            <span className="text-xs" style={{ color: colors.muted }}>
                              {categories.find(
                                (cat) => cat.id === item.category_id,
                              )?.name || "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span
                              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg ${
                                item.stock_status === "instock"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.stock_status === "low"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.stock_status}
                            </span>
                            {item.is_daily_special && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg" style={{ background: `${colors.darkPeach}20`, color: colors.darkPeach }}>
                                ✨ ယနေ့အထူး
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg neu-button"
                            style={{ color: colors.olive }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ color: "#9B1D1D", background: "#FEF2F2" }}
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
                    <thead>
                      <tr>
                        {["Status", "Image", "Item", "Category", "Price", "Stock / Tags", "Actions"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                              style={{ color: colors.muted, background: colors.surface }}
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: `${colors.muted}15` }}>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors"
                          style={{ background: colors.surface }}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleAvailability(item.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                              style={{
                                color: item.is_available ? "#2D6A4F" : "#9B1D1D",
                                background: item.is_available ? "#ECFDF5" : "#FEF2F2",
                              }}
                            >
                              {item.is_available ? "ရှိ" : "မရှိ"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {item.foodUrl ? (
                              <img
                                src={item.foodUrl}
                                alt={item.name}
                                className="w-11 h-11 object-cover rounded-xl"
                                style={{ boxShadow: "2px 2px 4px #D4CCC0" }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[10px]" style={{ background: colors.bg, color: colors.muted }}>
                                No Img
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium" style={{ color: colors.textDark }}>
                              {item.name}
                            </div>
                            {item.name_en && (
                              <div className="text-xs" style={{ color: colors.muted }}>
                                {item.name_en}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: colors.textDark }}>
                            {categories.find(
                              (cat) => cat.id === item.category_id,
                            )?.name || "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: colors.textDark }}>
                            {item.price} MMK
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <span
                              className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg block w-max ${
                                item.stock_status === "instock"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.stock_status === "low"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.stock_status}
                            </span>
                            {item.is_daily_special && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg block w-max" style={{ background: `${colors.darkPeach}20`, color: colors.darkPeach }}>
                                ✨ ယနေ့အထူး
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg neu-button"
                                style={{ color: colors.olive }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteItem(item.id, item.name)
                                }
                                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                                style={{ color: "#9B1D1D", background: "#FEF2F2" }}
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
              <div className="p-5 sm:p-6 rounded-2xl neu-card">
                <h3
                  className="text-sm font-bold mb-5 tracking-wide uppercase"
                  style={{ color: colors.muted }}
                >
                  Create New Category
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
                  <input
                    type="text"
                    placeholder="Name (Myanmar)"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
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
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
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
                    className="neu-input px-4 py-2.5 rounded-xl text-sm w-full"
                    style={{ color: colors.textDark }}
                  />
                </div>
                <button
                  onClick={handleAddCategory}
                  className="mt-4 px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${colors.sage}, ${colors.olive})`,
                    color: "white",
                    boxShadow: `0 4px 12px ${colors.olive}40`,
                  }}
                >
                  Save Category
                </button>
              </div>

              {/* Categories Table */}
              <div className="rounded-2xl neu-card overflow-hidden max-w-2xl">
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y" style={{ borderColor: `${colors.muted}20` }}>
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4" style={{ background: colors.surface }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm" style={{ color: colors.textDark }}>
                            {cat.name}
                          </div>
                          {cat.name_en && (
                            <div className="text-xs" style={{ color: colors.muted }}>
                              {cat.name_en}
                            </div>
                          )}
                          <div className="text-xs mt-1" style={{ color: colors.muted }}>
                            Order: {cat.display_order}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ color: "#9B1D1D", background: "#FEF2F2" }}
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
                    <thead>
                      <tr>
                        {["Myanmar Name", "English Name", "Order", "Actions"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                              style={{ color: colors.muted, background: colors.surface }}
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: `${colors.muted}15` }}>
                      {categories.map((cat) => (
                        <tr key={cat.id} style={{ background: colors.surface }}>
                          <td className="px-4 py-3 font-medium" style={{ color: colors.textDark }}>
                            {cat.name}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: colors.muted }}>
                            {cat.name_en || "—"}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-bold" style={{ color: colors.textDark }}>
                            {cat.display_order}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                              style={{ color: "#9B1D1D", background: "#FEF2F2" }}
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
