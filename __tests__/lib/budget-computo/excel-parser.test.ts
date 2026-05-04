import { describe, expect, it } from "vitest";
import * as XLSX from "@e965/xlsx";
import { parseBudgetExcelWorkbook } from "@/lib/budget-computo/excel-parser";

function sheet(rows: any[][]) {
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildWorkbook() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      ["CODIGO", "DESIGNACION", "UNIDAD", "PRECIO"],
      [1, "CEMENTO", "KG", 10],
      [null, "AGLOMERANTES"],
      [2, "ARENA", "M3", 100],
    ]),
    "INSUMOS"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [1, "OFICIAL ESPEC.", 800, 160, 960, 537.6, 139.2, 48, 1684.8, 210.6],
      [2, "OFICIAL", 700, 140, 840, 470.4, 121.8, 42, 1474.2, 184.28],
      [4, "AYUDANTE", 500, 100, 600, 336, 87, 30, 1053, 131.63],
      [],
      [],
      [],
      [],
      [5, "Sereno", 1000],
    ]),
    "MO"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, "Nº", "DESIGNACION", "UNIDAD", "CANTIDAD", "PRECIO UNITARIO", "SUBTOTAL", "TOTAL", "% INCID."],
      [null, 1, "PRE. TERRENO", null, null, null, null, 1200, 1],
      [null, "1.1", "Limpieza", "GL", 10, 120, 1200],
    ]),
    "L8 (14)"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, "Nº", "DESIGNACION", "UNIDAD", "CANTIDAD", "PRECIO UNITARIO", "SUBTOTAL", "% INCID.", "TOTAL"],
      [null, 1, "PRE. TERRENO", null, null, null, null, null, 120],
      [null, "1.1", "Limpieza", "GL", 1, 120, 120],
    ]),
    "L8"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, 1, "PRE. TERRENO"],
      [],
      [null, "1.1", "Limpieza", null, null, null, "GL", null, 1],
      [null, "A", "MATERIALES"],
      [null, null, "DESIGNACION", "UNIDAD", "CANTIDAD", "PRECIO"],
      [null, null, null, null, null, "UNITARIO", "TOTAL"],
      [1, null, "CEMENTO", "KG", 2, 10, 20],
      [2, null, "ARENA", "M3", 1, 100, 100],
      [],
      [],
      [],
      [],
      [null, null, "SUBTOTAL MATERIALES (A)", null, null, null, 120],
      [null, "B", "MANO DE OBRA"],
      [2, null, "OFICIAL", 1, "HS", 184.28, 184.28],
      [],
      [],
      [null, null, "SUBTOTAL MANO DE OBRA (B)", null, null, null, 184.28],
      [],
      ["1.1", "C", "COSTO NETO TOTAL", null, null, null, 304.28],
    ]),
    "ANALISIS DE PRECIOS"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, null, "Subtotal", null, null, null, null, 1200],
      [null, null, "Subtotal 1", null, null, null, null, 1200],
      [],
      [null, null, "Gastos Generales", null, null, 0.15, null, 180],
      [null, null, "Subtotal 2", null, null, null, null, 1380],
      [],
      [null, null, "Beneficio", null, null, 0.1, null, 138],
      [null, null, "Subtotal 3", null, null, null, null, 1518],
      [],
      [null, null, "Impuestos", null, null, 0.105, null, 159.39],
      [],
      [null, null, "PRECIO FINAL", null, null, null, null, 1677.39],
    ]),
    "Estr-Ofer"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [null, null, null, "MES 1", "MES 2", "MES 3", "MES 4", "MES 5", "MES 6", "MES 7", "TOTAL"],
      [null, null, "SERENO", 1, 2, 3, 4, 5, 6, 7, 28],
    ]),
    "G.G"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, "Nº", "DESCRIPCION DEL ITEM", null, null, "% Incid.", "MESES"],
      [null, null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7],
      [null, 1, "PRE. TERRENO", null, null, 1, 0.5, 0.5],
    ]),
    "Plan de Trabajos"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet([
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [null, null, null, "APORTE NACION", "APORTE PROVINCIAL", "PARCIAL MENSUAL", "ACUMULADO"],
      [],
      [null, "1 DESEMBOLSOS", null, 100, 0, 100, 100],
    ]),
    "Crono"
  );

  workbook.Sheets["INSUMOS"].D7 = { t: "n", v: 10, f: "[3]PRESUPUESTO!A1" };

  return workbook;
}

describe("parseBudgetExcelWorkbook", () => {
  it("extracts the computo core from a budget workbook", () => {
    const preview = parseBudgetExcelWorkbook(buildWorkbook(), {
      fileName: "computo.xlsx",
      fileSize: 1234,
    });

    expect(preview.sourceSummary.rubroCount).toBe(1);
    expect(preview.sourceSummary.itemCount).toBe(1);
    expect(preview.sourceSummary.insumoCount).toBe(2);
    expect(preview.sourceSummary.materialLineCount).toBe(2);
    expect(preview.sourceSummary.laborLineCount).toBe(1);
    expect(preview.rubros[0].subItems[0]).toMatchObject({
      code: "1.1",
      quantity: 10,
      costNetTotal: 304.28,
    });
    expect(preview.offerStructure?.generalExpensesPct).toBe(15);
    expect(preview.generalExpenses[0].total).toBe(28);
    expect(preview.workPlan[0].monthPercentages.slice(0, 2)).toEqual([50, 50]);
    expect(preview.disbursements[0].monthlyAmount).toBe(100);
    expect(preview.sourceSummary.externalFormulaRefCount).toBe(1);
  });
});
