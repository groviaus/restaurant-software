import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requirePermission, getUserProfile, getEffectiveOutletId , handleApiError } from '@/lib/auth';
import { z } from 'zod';

const ingredientSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  preparation_loss_percent: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
});

const upsertRecipeSchema = z.object({
  menu_item_id: z.string().uuid(),
  yield_quantity: z.number().positive().default(1),
  yield_unit: z.string().min(1).default('pcs'),
  notes: z.string().optional().nullable(),
  ingredients: z.array(ingredientSchema),
});

export async function GET(request: NextRequest) {
  try {
    await requirePermission('inventory', 'view');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menu_item_id');

    const supabase = createServiceRoleClient();
    let query = supabase
      .from('recipes')
      .select(`
        *,
        menu_item:items (id, name, category),
        recipe_ingredients (
          *,
          inventory_item:inventory_items (id, name, stock_unit, current_stock)
        )
      `)
      .eq('outlet_id', effectiveOutletId);

    if (menuItemId) query = query.eq('menu_item_id', menuItemId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const normalizedRecipes = (data ?? []).map((r: any) => ({
      ...r,
      ingredients: r.recipe_ingredients ?? r.ingredients ?? [],
      recipe_ingredients: r.recipe_ingredients ?? r.ingredients ?? [],
    }));

    return NextResponse.json({ recipes: normalizedRecipes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('inventory', 'edit');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const body = await request.json();
    const validated = upsertRecipeSchema.parse(body);

    const supabase = createServiceRoleClient();

    // Upsert recipe (by outlet + menu_item unique constraint)
    const { data: recipe, error: recipeError } = await (supabase as any)
      .from('recipes')
      .upsert(
        {
          outlet_id: effectiveOutletId,
          menu_item_id: validated.menu_item_id,
          yield_quantity: validated.yield_quantity,
          yield_unit: validated.yield_unit,
          notes: validated.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'outlet_id,menu_item_id' }
      )
      .select()
      .single();

    if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });

    const recipeData = recipe as any;

    // Delete existing ingredients and re-insert (simplest upsert for array)
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeData.id);

    if (validated.ingredients.length > 0) {
      const ingredientsToInsert = validated.ingredients.map((ing) => ({
        recipe_id: recipeData.id,
        inventory_item_id: ing.inventory_item_id,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation_loss_percent: ing.preparation_loss_percent,
        notes: ing.notes ?? null,
      }));

      const { error: ingError } = await (supabase as any)
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 });
    }

    // Fetch complete recipe with ingredients
    const { data: fullRecipe } = await supabase
      .from('recipes')
      .select(`
        *,
        menu_item:items (id, name),
        recipe_ingredients (
          *,
          inventory_item:inventory_items (id, name, stock_unit, current_stock)
        )
      `)
      .eq('id', recipeData.id)
      .single();

    const normalizedRecipe = fullRecipe
      ? {
          ...(fullRecipe as any),
          ingredients: (fullRecipe as any).recipe_ingredients ?? [],
          recipe_ingredients: (fullRecipe as any).recipe_ingredients ?? [],
        }
      : null;

    return NextResponse.json({ recipe: normalizedRecipe }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: err.message || 'Failed to save recipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('inventory', 'delete');
    const profile = await getUserProfile();
    const effectiveOutletId = getEffectiveOutletId(profile);
    if (!effectiveOutletId) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menu_item_id');
    if (!menuItemId) return NextResponse.json({ error: 'menu_item_id required' }, { status: 400 });

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('menu_item_id', menuItemId)
      .eq('outlet_id', effectiveOutletId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete recipe' }, { status: 500 });
  }
}
