import { useCallback, useEffect, useState } from "react";
import { BudgetVersion, BudgetItem } from "@/lib/types/budget";
import { BudgetStats } from "./budget-stats";
import { BudgetChart } from "./budget-chart";
import { BudgetItemsTable } from "./budget-items-table";
import { BudgetVersionHistory } from "./budget-version-history";
import { BudgetPdfExport } from "./budget-pdf-export";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { getBudgetsByProject, saveBudgetVersion } from "@/lib/api/budgets";

interface BudgetModuleProps {
    projectId: string;
}

const SEED_ITEMS: Omit<BudgetItem, "id">[] = [
    { category: "materials", description: "Hormigón H30 — losa planta baja", unit: "m³", qtyPlanned: 120, priceUnitPlanned: 180, qtyActual: 115, priceUnitActual: 185 },
    { category: "materials", description: "Acero DN 1/2\" — estructura", unit: "kg", qtyPlanned: 8500, priceUnitPlanned: 1.2, qtyActual: 9100, priceUnitActual: 1.25 },
    { category: "materials", description: "Ladrillos cerámicos — mampostería", unit: "un", qtyPlanned: 15000, priceUnitPlanned: 0.45, qtyActual: 14800, priceUnitActual: 0.48 },
    { category: "labor", description: "Oficial de obra — cimentación", unit: "días", qtyPlanned: 60, priceUnitPlanned: 220, qtyActual: 72, priceUnitActual: 220 },
    { category: "labor", description: "Medio oficial — mampostería", unit: "días", qtyPlanned: 80, priceUnitPlanned: 160, qtyActual: 75, priceUnitActual: 160 },
    { category: "equipment", description: "Alquiler grúa torre — 3 meses", unit: "global", qtyPlanned: 1, priceUnitPlanned: 18000, qtyActual: 1, priceUnitActual: 18000 },
    { category: "services", description: "Inspección estructural", unit: "global", qtyPlanned: 1, priceUnitPlanned: 3500, qtyActual: 1, priceUnitActual: 4200 },
    { category: "contingency", description: "Imprevistos generales", unit: "global", qtyPlanned: 1, priceUnitPlanned: 25000, qtyActual: 0, priceUnitActual: 0 },
];

function makeId() {
    return Math.random().toString(36).slice(2, 10);
}

function generateSeedVersion(): Omit<BudgetVersion, "createdAt"> {
    return {
        id: makeId(),
        version: 1,
        label: "Versión 1",
        description: "Presupuesto inicial aprobado",
        items: SEED_ITEMS.map((i) => ({ ...i, id: makeId() })),
    };
}

export function BudgetModule({ projectId }: BudgetModuleProps) {
    const [versions, setVersions] = useState<BudgetVersion[]>([]);
    const [activeVersionId, setActiveVersionId] = useState<string>("");
    const [newVersionDialog, setNewVersionDialog] = useState(false);
    const [newVersionDesc, setNewVersionDesc] = useState("");
    const [mounted, setMounted] = useState(false);

    const loadData = useCallback(async () => {
        const data = await getBudgetsByProject(Number(projectId));
        if (data && data.length > 0) {
            setVersions(data);
            setActiveVersionId(data[data.length - 1].id);
        } else {
            // First time accessing this project's budget, inject the seed version via Supabase
            const seed = generateSeedVersion();
            const created = await saveBudgetVersion(Number(projectId), seed);
            if (created) {
                setVersions([created]);
                setActiveVersionId(created.id);
            }
        }
        setMounted(true);
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];

    const updateItems = async (items: BudgetItem[]) => {
        if (!activeVersion) return;
        const updatedVersion = { ...activeVersion, items };
        const saved = await saveBudgetVersion(Number(projectId), updatedVersion);
        if (saved) {
            setVersions(versions.map((v) => (v.id === activeVersionId ? saved : v)));
        }
    };

    const handleAddItem = (data: Omit<BudgetItem, "id">) => {
        const newItem: BudgetItem = { ...data, id: makeId() };
        updateItems([...(activeVersion?.items ?? []), newItem]);
    };

    const handleEditItem = (id: string, data: Omit<BudgetItem, "id">) => {
        updateItems(
            (activeVersion?.items ?? []).map((i) => (i.id === id ? { ...data, id } : i))
        );
    };

    const handleDeleteItem = (id: string) => {
        updateItems((activeVersion?.items ?? []).filter((i) => i.id !== id));
    };

    const handleNewVersion = async () => {
        if (!activeVersion) return;
        const next: Omit<BudgetVersion, "createdAt"> = {
            id: makeId(),
            version: versions.length + 1,
            label: `Versión ${versions.length + 1}`,
            description: newVersionDesc.trim() || "Sin descripción",
            items: activeVersion.items.map((i) => ({ ...i, id: makeId() })),
        };
        const saved = await saveBudgetVersion(Number(projectId), next);
        if (saved) {
            setVersions([...versions, saved]);
            setActiveVersionId(saved.id);
            setNewVersionDesc("");
            setNewVersionDialog(false);
        }
    };

    if (!mounted || !activeVersion) {
        return (
            <div className="mt-6 flex items-center justify-center py-20 text-muted-foreground text-sm">
                Cargando presupuesto desde la base de datos...
            </div>
        );
    }


    return (
        <div className="mt-6 flex flex-col gap-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-lg font-semibold">{activeVersion.label}</h2>
                        <p className="text-sm text-muted-foreground">{activeVersion.description}</p>
                    </div>
                </div>
                <BudgetPdfExport version={activeVersion} projectId={projectId} />
            </div>

            {/* KPI Stats */}
            <BudgetStats items={activeVersion.items} />

            {/* Chart + Version History */}
            <div className="grid gap-6 lg:grid-cols-2">
                <BudgetChart items={activeVersion.items} />
                <BudgetVersionHistory
                    versions={versions}
                    activeVersionId={activeVersionId}
                    onActivate={setActiveVersionId}
                    onNewVersion={() => setNewVersionDialog(true)}
                />
            </div>

            {/* Items Table */}
            <BudgetItemsTable
                items={activeVersion.items}
                onAdd={handleAddItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
            />

            {/* New Version Dialog */}
            <Dialog open={newVersionDialog} onOpenChange={setNewVersionDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Crear nueva versión del presupuesto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            Se creará <strong>Versión {versions.length + 1}</strong> copiando todos los ítems de la versión activa.
                        </p>
                        <div className="space-y-1.5">
                            <Label>Descripción del cambio</Label>
                            <Textarea
                                value={newVersionDesc}
                                onChange={(e) => setNewVersionDesc(e.target.value)}
                                placeholder="Ej: Actualización por incremento de materiales en Q2"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewVersionDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleNewVersion}>Crear versión</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
