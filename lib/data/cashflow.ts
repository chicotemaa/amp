import { Transaction, MonthlyCashflow } from "@/lib/types/cashflow";

/**
 * Canonical cashflow transactions — single source of truth.
 * All stats (KPIs, charts) are computed from this array.
 * projectName is denormalized for fast display (matches canonical project names).
 *
 * Total ingresos: $450,000
 * Total egresos:  $331,500
 * Margen neto:    26.3%
 */
export const TRANSACTIONS: Transaction[] = [
    {
        id: 1,
        type: "ingreso",
        description: "Cuota 1/4 — Torre Residencial Marina",
        amount: 150000,
        date: "2024-03-18",
        category: "contracts",
        projectId: 1,
        projectName: "Torre Residencial Marina",
    },
    {
        id: 2,
        type: "ingreso",
        description: "Cuota 1/3 — Centro Comercial Plaza Norte",
        amount: 180000,
        date: "2024-03-14",
        category: "contracts",
        projectId: 2,
        projectName: "Centro Comercial Plaza Norte",
    },
    {
        id: 3,
        type: "ingreso",
        description: "Liquidación final — Eco-Resort Costa Verde",
        amount: 120000,
        date: "2024-02-28",
        category: "contracts",
        projectId: 5,
        projectName: "Eco-Resort Costa Verde",
    },
    {
        id: 4,
        type: "egreso",
        description: "Compra materiales — Torre Residencial",
        amount: 52000,
        date: "2024-03-17",
        category: "materials",
        projectId: 1,
        projectName: "Torre Residencial Marina",
    },
    {
        id: 5,
        type: "egreso",
        description: "Pago nómina equipo — Marzo 2024",
        amount: 58000,
        date: "2024-03-16",
        category: "labor",
        projectId: null,
        projectName: "General",
    },
    {
        id: 6,
        type: "egreso",
        description: "Compra materiales acabados — Centro Comercial",
        amount: 65000,
        date: "2024-03-15",
        category: "materials",
        projectId: 2,
        projectName: "Centro Comercial Plaza Norte",
    },
    {
        id: 7,
        type: "egreso",
        description: "Subcontratista estructuras — Torre Residencial",
        amount: 68000,
        date: "2024-03-10",
        category: "subcontracts",
        projectId: 1,
        projectName: "Torre Residencial Marina",
    },
    {
        id: 8,
        type: "egreso",
        description: "Alquiler grúa — Complejo Deportivo Olímpico",
        amount: 28000,
        date: "2024-03-08",
        category: "equipment",
        projectId: 3,
        projectName: "Complejo Deportivo Olímpico",
    },
    {
        id: 9,
        type: "egreso",
        description: "Pago nómina equipo — Febrero 2024",
        amount: 55000,
        date: "2024-02-29",
        category: "labor",
        projectId: null,
        projectName: "General",
    },
    {
        id: 10,
        type: "egreso",
        description: "Servicios generales (agua, luz, oficina)",
        amount: 5500,
        date: "2024-03-05",
        category: "services",
        projectId: null,
        projectName: "General",
    },
];

/**
 * Monthly cashflow chart data (Ene–Jun).
 * Total at end of period matches the TRANSACTIONS totals.
 */
export const MONTHLY_CASHFLOW: MonthlyCashflow[] = [
    { month: "Ene", ingresos: 45000, egresos: 38000 },
    { month: "Feb", ingresos: 120000, egresos: 98000 },  // liquidación Eco-Resort
    { month: "Mar", ingresos: 285000, egresos: 195500 }, // cuotas Torres + CC
    { month: "Abr", ingresos: 0, egresos: 0 },           // proyectado
    { month: "May", ingresos: 0, egresos: 0 },
    { month: "Jun", ingresos: 0, egresos: 0 },
];
