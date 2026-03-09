import { supabase } from "@/lib/supabase";
import { BudgetVersion, BudgetItem, BudgetCategory } from "@/lib/types/budget";

interface ProjectBudgetRow {
    id: string;
    project_id: number;
    version: number;
    label: string;
    description: string;
    created_at: string;
}

interface ProjectBudgetItemRow {
    id: string;
    budget_id: string;
    category: string;
    description: string;
    unit: string;
    qty_planned: number;
    price_unit_planned: number;
    qty_actual: number;
    price_unit_actual: number;
    created_at: string;
}

export async function getBudgetsByProject(projectId: number): Promise<BudgetVersion[]> {
    const { data: budgetsData, error: budgetsError } = await supabase
        .from("project_budgets")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: true }) as any;

    if (budgetsError) {
        console.error("Error fetching budgets:", budgetsError.message);
        return [];
    }

    if (!budgetsData || budgetsData.length === 0) {
        return [];
    }

    const versionIds = (budgetsData as ProjectBudgetRow[]).map((b) => b.id);

    const { data: itemsData, error: itemsError } = await supabase
        .from("project_budget_items")
        .select("*")
        .in("budget_id", versionIds) as any;

    if (itemsError) {
        console.error("Error fetching budget items:", itemsError.message);
        return [];
    }

    return (budgetsData as ProjectBudgetRow[]).map((b) => {
        const itemsForVersion = ((itemsData as ProjectBudgetItemRow[]) || [])
            .filter((i) => i.budget_id === b.id)
            .map((i): BudgetItem => ({
                id: i.id,
                category: i.category as BudgetCategory,
                description: i.description,
                unit: i.unit,
                qtyPlanned: Number(i.qty_planned),
                priceUnitPlanned: Number(i.price_unit_planned),
                qtyActual: Number(i.qty_actual),
                priceUnitActual: Number(i.price_unit_actual),
            }));

        return {
            id: b.id,
            version: b.version,
            label: b.label,
            description: b.description,
            createdAt: b.created_at,
            items: itemsForVersion,
        };
    });
}

export async function saveBudgetVersion(
    projectId: number,
    version: Omit<BudgetVersion, "createdAt">
): Promise<BudgetVersion | null> {
    const { data: budgetData, error: budgetError } = await (supabase
        .from("project_budgets")
        // @ts-ignore
        .upsert({
            id: version.id,
            project_id: projectId,
            version: version.version,
            label: version.label,
            description: version.description,
        })
        .select()
        .single() as any);

    if (budgetError) {
        console.error("Error saving budget version:", budgetError.message);
        return null;
    }

    // Upsert items (first delete existing ones for simplicity of sync, or just upsert if ID matches)
    // To cleanly sync, we can delete all items for this version and re-insert them.
    await supabase.from("project_budget_items").delete().eq("budget_id", version.id);

    if (version.items.length > 0) {
        const itemsToInsert = version.items.map((i) => ({
            id: i.id,
            budget_id: version.id,
            category: i.category,
            description: i.description,
            unit: i.unit,
            qty_planned: i.qtyPlanned,
            price_unit_planned: i.priceUnitPlanned,
            qty_actual: i.qtyActual,
            price_unit_actual: i.priceUnitActual,
        }));

        // @ts-ignore
        const { error: itemsError } = await (supabase.from("project_budget_items").insert(itemsToInsert) as any);

        if (itemsError) {
            console.error("Error saving budget items:", itemsError.message);
        }
    }

    return {
        ...version,
        createdAt: (budgetData as ProjectBudgetRow).created_at,
    };
}
