"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface MenuItemInput {
  category_id: string;
  name: string;
  name_en?: string | null;
  price: number;
  foodUrl?: string | null;
  description?: string | null;
  is_available?: boolean;
  stock_status?: "instock" | "low" | "outofstock";
  is_daily_special?: boolean;
}

/**
 * Helper to upload a file to Supabase storage bucket 'menu-images'
 * Expects a FormData object containing the file
 */
export async function uploadMenuItemImage(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "No valid image file detected." };
  }

  const supabase = await createClient();

  // Create a clean, unique file path (e.g., items/1719735432100-mohinga.jpg)
  const fileExt = file.name.split(".").pop();
  const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExt}`;
  const filePath = `items/${cleanFileName}`;

  // Upload the file buffer to the bucket
  const { error } = await supabase.storage
    .from("menu-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { success: false, error: `Storage upload failed: ${error.message}` };
  }

  // Generate the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}

export async function getMenuItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(name, name_en)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch menu items: ${error.message}`);
  return data;
}

export async function createMenuItem(input: MenuItemInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .insert([
      {
        category_id: input.category_id,
        name: input.name,
        name_en: input.name_en || null,
        price: input.price,
        foodUrl: input.foodUrl || null, // Map storage publicUrl here from frontend
        description: input.description || null,
        is_available: input.is_available ?? true,
        stock_status: input.stock_status ?? "instock",
        is_daily_special: input.is_daily_special ?? false,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      ...(input.category_id && { category_id: input.category_id }),
      ...(input.name && { name: input.name }),
      ...(input.name_en !== undefined && { name_en: input.name_en }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.foodUrl !== undefined && { foodUrl: input.foodUrl }), // Updates with new image url if provided
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.is_available !== undefined && {
        is_available: input.is_available,
      }),
      ...(input.stock_status && { stock_status: input.stock_status }),
      ...(input.is_daily_special !== undefined && {
        is_daily_special: input.is_daily_special,
      }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient();

  // Optional step: Grab the item first if you want to extract and parse the foodUrl
  // to run a delete request via `supabase.storage.from('menu-images').remove([path])`

  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function toggleItemAvailabilityAction(itemId: string) {
  const supabase = await createClient();

  const { data: newStatus, error } = await supabase.rpc(
    "toggle_item_availability",
    {
      item_id: itemId,
    },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, newStatus };
}
