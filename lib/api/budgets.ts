import { supabase } from "@/lib/supabase";
import { BudgetVersion, BudgetItem, BudgetCategory } from "@/lib/types/budget";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type { Database } from "@/lib/types/supabase";

type ProjectBudgetRow = Database["public"]["Tables"]["project_budgets"]["Row"];
type ProjectBudgetItemRow = Database["public"]["Tables"]["project_budget_items"]["Row"];

export async function getBudgetsByProject(projectId: number): Promise<BudgetVersion[]> {
    const { data: budgetsData, error: budgetsError } = await supabase
        .from("project_budgets")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: true });

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
        .in("budget_id", versionIds);

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
    const existingVersion = await supabase
        .from("project_budgets")
        .select("id, version")
        .eq("id", version.id)
        .maybeSingle();

    const { data: budgetData, error: budgetError } = await supabase
        .from("project_budgets")
        .upsert({
            id: version.id,
            project_id: projectId,
            version: version.version,
            label: version.label,
            description: version.description,
        })
        .select()
        .single();

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

        const { error: itemsError } = await supabase.from("project_budget_items").insert(itemsToInsert);

        if (itemsError) {
            console.error("Error saving budget items:", itemsError.message);
        }
    }

    await logCurrentUserAuditEvent({
        entityType: "budget_version",
        entityId: version.id,
        projectId,
        action: existingVersion.data ? "update" : "create",
        fromState: existingVersion.data ? `v${existingVersion.data.version}` : null,
        toState: `v${version.version}`,
        metadata: {
            label: version.label,
            itemCount: version.items.length,
        },
    });

    return {
        ...version,
        createdAt: (budgetData as ProjectBudgetRow).created_at,
    };
}
