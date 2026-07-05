"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface CategoryInput {
  name: string;
  name_en?: string | null;
  display_order?: number;
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data;
}

export async function createCategory(input: CategoryInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        name: input.name,
        name_en: input.name_en || null,
        display_order: input.display_order ?? 0,
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

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({
      ...(input.name && { name: input.name }),
      ...(input.name_en !== undefined && { name_en: input.name_en }),
      ...(input.display_order !== undefined && {
        display_order: input.display_order,
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

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
