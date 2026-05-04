import * as XLSX from "@e965/xlsx";
import type { WorkBook, WorkSheet } from "@e965/xlsx";
import type { LaborCategory } from "@/lib/types/budget-computo";
import type {
  BudgetDisbursement,
  BudgetExcelImportPreview,
  BudgetExcelParsedRubro,
  BudgetExcelParsedSubItem,
  BudgetExcelSourceSummary,
  BudgetExcelWarning,
  BudgetInsumo,
  BudgetTypology,
  BudgetWorkPlanRubro,
} from "@/lib/types/budget-excel";

type CellValue = string | number | boolean | Date | null | undefined;

const REQUIRED_SHEETS = [
  "ANALISIS DE PRECIOS",
  "INSUMOS",
  "MO",
  "L8 (14)",
  "Estr-Ofer",
  "G.G",
  "Plan de Trabajos",
  "Crono",
];

const ERROR_VALUE_RE = /^#(REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NULL!|NUM!)$/i;

function normalizeSheetName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getSheet(workbook: WorkBook, name: string): WorkSheet | undefined {
  const wanted = normalizeSheetName(name);
  const actual = workbook.SheetNames.find(
    (sheetName) => normalizeSheetName(sheetName) === wanted
  );
  return actual ? workbook.Sheets[actual] : undefined;
}

function getSheetName(workbook: WorkBook, name: string): string {
  const wanted = normalizeSheetName(name);
  return (
    workbook.SheetNames.find((sheetName) => normalizeSheetName(sheetName) === wanted) ??
    name
  );
}

function getBounds(sheet: WorkSheet) {
  const ref = sheet["!ref"];
  if (!ref) {
    return { minRow: 1, maxRow: 0, minCol: 1, maxCol: 0 };
  }
  const range = XLSX.utils.decode_range(ref);
  return {
    minRow: range.s.r + 1,
    maxRow: range.e.r + 1,
    minCol: range.s.c + 1,
    maxCol: range.e.c + 1,
  };
}

function cellAddress(row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
}

function cell(sheet: WorkSheet, row: number, col: number): XLSX.CellObject | undefined {
  return sheet[cellAddress(row, col)];
}

function value(sheet: WorkSheet, row: number, col: number): CellValue {
  const current = cell(sheet, row, col);
  return current?.v as CellValue;
}

function text(sheet: WorkSheet, row: number, col: number): string | null {
  const raw = value(sheet, row, col);
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function num(sheet: WorkSheet, row: number, col: number): number {
  return toNumber(value(sheet, row, col));
}

function toNumber(input: CellValue): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const cleaned = input
      .replace(/\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isNumeric(input: CellValue): input is number {
  return typeof input === "number" && Number.isFinite(input);
}

function itemCode(input: CellValue): string | null {
  if (typeof input === "string" && /^\d+\.\d+/.test(input.trim())) {
    return input.trim();
  }
  if (typeof input === "number" && Number.isFinite(input)) {
    const asText = String(input);
    return /^\d+\.\d+/.test(asText) ? asText : null;
  }
  return null;
}

function laborCategoryFromCode(code: number, label: string | null): LaborCategory {
  if (code === 1) return "oficial_espec";
  if (code === 2) return "oficial";
  if (code === 3) return "medio_oficial";
  if (code === 4) return "ayudante";
  if (code === 5) return "sereno";

  const normalized = (label ?? "").toLowerCase();
  if (normalized.includes("especial")) return "oficial_espec";
  if (normalized.includes("medio")) return "medio_oficial";
  if (normalized.includes("ayud")) return "ayudante";
  if (normalized.includes("sereno")) return "sereno";
  return "oficial";
}

function percentFromSheet(valuePct: number) {
  if (valuePct > 0 && valuePct < 1) return valuePct * 100;
  return valuePct;
}

function makeWarning(
  severity: BudgetExcelWarning["severity"],
  code: string,
  message: string,
  details: Partial<BudgetExcelWarning> = {}
): BudgetExcelWarning {
  return { severity, code, message, ...details };
}

function scanWorkbook(workbook: WorkBook): {
  warnings: BudgetExcelWarning[];
  externalFormulaRefCount: number;
  formulaErrorCount: number;
} {
  const warnings: BudgetExcelWarning[] = [];
  let externalFormulaRefCount = 0;
  let formulaErrorCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const { minRow, maxRow, minCol, maxCol } = getBounds(sheet);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const address = cellAddress(row, col);
        const current = sheet[address];
        if (!current) continue;

        const formula = typeof current.f === "string" ? current.f : "";
        if (formula.includes("[")) {
          externalFormulaRefCount += 1;
          if (externalFormulaRefCount <= 10) {
            warnings.push(
              makeWarning(
                "warning",
                "external_formula_ref",
                "La planilla contiene formulas con referencias a otros archivos. Se importan los valores cacheados del Excel.",
                { sheetName, row, cell: address }
              )
            );
          }
        }

        const display = String(current.w ?? current.v ?? "");
        if (current.t === "e" || ERROR_VALUE_RE.test(display)) {
          formulaErrorCount += 1;
          if (formulaErrorCount <= 10) {
            warnings.push(
              makeWarning(
                "warning",
                "formula_error",
                `La celda tiene un error de formula (${display}). Revisar antes de usar ese dato como contractual.`,
                { sheetName, row, cell: address }
              )
            );
          }
        }
      }
    }
  }

  return { warnings, externalFormulaRefCount, formulaErrorCount };
}

function parseInsumos(sheet: WorkSheet): BudgetInsumo[] {
  const { maxRow } = getBounds(sheet);
  const entries: BudgetInsumo[] = [];
  let category: string | null = null;

  for (let row = 7; row <= maxRow; row += 1) {
    const code = value(sheet, row, 1);
    const description = text(sheet, row, 2);
    const unit = text(sheet, row, 3);
    const unitPrice = num(sheet, row, 4);

    if (!isNumeric(code) && description && unitPrice === 0) {
      category = description;
      continue;
    }

    if (isNumeric(code) && description) {
      entries.push({
        code,
        category,
        description,
        unit,
        unitPrice,
        sourceSheet: "INSUMOS",
        sourceRow: row,
      });
    }
  }

  return entries;
}

function parseLaborRates(sheet: WorkSheet) {
  const rates = [];
  for (let row = 8; row <= 15; row += 1) {
    const code = value(sheet, row, 1);
    const label = text(sheet, row, 2);
    if (!isNumeric(code) || !label) continue;

    const baseDailyPrice = num(sheet, row, 3);
    const attendanceBonus = num(sheet, row, 4);
    const taxableTotal = num(sheet, row, 5);
    const socialCharges = num(sheet, row, 6);
    const art = num(sheet, row, 7);
    const other = num(sheet, row, 8);
    const dailyCost = num(sheet, row, 9) || num(sheet, row, 11) || baseDailyPrice;
    const hourlyCost = num(sheet, row, 10);

    rates.push({
      category: laborCategoryFromCode(code, label),
      baseDailyPrice,
      attendanceBonusPct:
        baseDailyPrice > 0 ? percentFromSheet(attendanceBonus / baseDailyPrice) : 0,
      socialChargesPct:
        taxableTotal > 0 ? percentFromSheet(socialCharges / taxableTotal) : 0,
      artPct: taxableTotal > 0 ? percentFromSheet(art / taxableTotal) : 0,
      otherPct: taxableTotal > 0 ? percentFromSheet(other / taxableTotal) : 0,
      dailyCost,
      hourlyCost,
    });
  }
  return rates;
}

interface AnalysisBlock {
  code: string;
  rubroNumber: number;
  description: string;
  unit: string;
  quantity: number;
  subtotalMaterials: number;
  subtotalLabor: number;
  costNetTotal: number;
  sourceRow: number;
  materials: BudgetExcelParsedSubItem["materials"];
  labor: BudgetExcelParsedSubItem["labor"];
}

function parseAnalysis(sheet: WorkSheet): Map<string, AnalysisBlock> {
  const { maxRow } = getBounds(sheet);
  const blocks = new Map<string, AnalysisBlock>();
  let row = 1;

  while (row <= maxRow) {
    const code = itemCode(value(sheet, row, 2));
    const description = text(sheet, row, 3);

    if (!code || !description) {
      row += 1;
      continue;
    }

    const block: AnalysisBlock = {
      code,
      rubroNumber: Number(code.split(".")[0]) || 0,
      description,
      unit: text(sheet, row, 7) ?? "GL",
      quantity: num(sheet, row, 9),
      subtotalMaterials: 0,
      subtotalLabor: 0,
      costNetTotal: 0,
      sourceRow: row,
      materials: [],
      labor: [],
    };

    let section: "materials" | "labor" | null = null;
    let cursor = row + 1;
    while (cursor <= maxRow) {
      const nextCode = itemCode(value(sheet, cursor, 2));
      const nextDescription = text(sheet, cursor, 3);
      const maybeRubroNumber = value(sheet, cursor, 2);

      if (
        (nextCode && nextDescription) ||
        (isNumeric(maybeRubroNumber) && nextDescription)
      ) {
        break;
      }

      const labelB = (text(sheet, cursor, 2) ?? "").toUpperCase();
      const labelC = (text(sheet, cursor, 3) ?? "").toUpperCase();

      if (labelB === "A" && labelC.includes("MATERIALES")) {
        section = "materials";
      } else if (labelB === "B" && labelC.includes("MANO DE OBRA")) {
        section = "labor";
      } else if (labelC.includes("SUBTOTAL MATERIALES")) {
        block.subtotalMaterials = num(sheet, cursor, 7);
      } else if (labelC.includes("SUBTOTAL MANO DE OBRA")) {
        block.subtotalLabor = num(sheet, cursor, 7);
      } else if (labelB === "C" && labelC.includes("COSTO NETO")) {
        block.costNetTotal = num(sheet, cursor, 7);
      } else if (section === "materials") {
        const insumoCode = value(sheet, cursor, 1);
        const materialDescription = text(sheet, cursor, 3);
        const quantity = num(sheet, cursor, 5);
        const unitPrice = num(sheet, cursor, 6);
        const total = num(sheet, cursor, 7);

        if (
          isNumeric(insumoCode) &&
          materialDescription &&
          (quantity !== 0 || unitPrice !== 0 || total !== 0)
        ) {
          block.materials.push({
            insumoCode,
            description: materialDescription,
            unit: text(sheet, cursor, 4) ?? "",
            quantity,
            unitPrice,
            total,
            sortOrder: block.materials.length,
          });
        }
      } else if (section === "labor") {
        const laborCode = value(sheet, cursor, 1);
        const laborLabel = text(sheet, cursor, 3);
        const hours = num(sheet, cursor, 4);
        const hourlyRate = num(sheet, cursor, 6);
        const total = num(sheet, cursor, 7);

        if (
          isNumeric(laborCode) &&
          laborLabel &&
          (hours !== 0 || hourlyRate !== 0 || total !== 0)
        ) {
          block.labor.push({
            laborCategory: laborCategoryFromCode(laborCode, laborLabel),
            hours,
            hourlyRate,
            total,
            sortOrder: block.labor.length,
          });
        }
      }

      cursor += 1;
    }

    if (block.costNetTotal === 0) {
      block.costNetTotal = block.subtotalMaterials + block.subtotalLabor;
    }
    blocks.set(code, block);
    row = cursor;
  }

  return blocks;
}

interface GroupItem {
  code: string;
  rubroNumber: number;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sourceRow: number;
}

interface GroupRubro {
  number: number;
  name: string;
  total: number;
  incidencePct: number;
  sourceRow: number;
}

function parseGroupSheet(sheet: WorkSheet): { rubros: GroupRubro[]; items: GroupItem[] } {
  const { maxRow } = getBounds(sheet);
  const rubros: GroupRubro[] = [];
  const items: GroupItem[] = [];

  for (let row = 1; row <= maxRow; row += 1) {
    const code = value(sheet, row, 2);
    const description = text(sheet, row, 3);

    if (isNumeric(code) && description) {
      rubros.push({
        number: code,
        name: description,
        total: num(sheet, row, 8) || num(sheet, row, 9),
        incidencePct: percentFromSheet(num(sheet, row, 9) || num(sheet, row, 10)),
        sourceRow: row,
      });
      continue;
    }

    const parsedCode = itemCode(code);
    if (parsedCode && description) {
      items.push({
        code: parsedCode,
        rubroNumber: Number(parsedCode.split(".")[0]) || 0,
        description,
        unit: text(sheet, row, 4) ?? "GL",
        quantity: num(sheet, row, 5),
        unitPrice: num(sheet, row, 6),
        subtotal: num(sheet, row, 7),
        sourceRow: row,
      });
    }
  }

  return { rubros, items };
}

function buildRubros(
  group: { rubros: GroupRubro[]; items: GroupItem[] },
  analysis: Map<string, AnalysisBlock>
): BudgetExcelParsedRubro[] {
  const rubros = group.rubros.map<BudgetExcelParsedRubro>((rubro, rubroIndex) => {
    const subItems = group.items
      .filter((item) => item.rubroNumber === rubro.number)
      .map<BudgetExcelParsedSubItem>((item, itemIndex) => {
        const detail = analysis.get(item.code);
        const subtotalMaterials =
          detail?.subtotalMaterials ??
          detail?.materials.reduce((sum, material) => sum + material.total, 0) ??
          0;
        const subtotalLabor =
          detail?.subtotalLabor ??
          detail?.labor.reduce((sum, labor) => sum + labor.total, 0) ??
          0;
        const costNetTotal =
          detail?.costNetTotal || item.unitPrice || subtotalMaterials + subtotalLabor;

        return {
          code: item.code,
          description: item.description || detail?.description || "",
          unit: item.unit || detail?.unit || "GL",
          quantity: item.quantity || detail?.quantity || 0,
          subtotalMaterials,
          subtotalLabor,
          costNetTotal,
          sourceSheet: "L8 (14)",
          sourceRow: item.sourceRow,
          materials: detail?.materials ?? [],
          labor: detail?.labor ?? [],
        };
      });

    const total = subItems.reduce(
      (sum, subItem) => sum + subItem.costNetTotal * subItem.quantity,
      0
    );

    return {
      number: rubro.number,
      name: rubro.name,
      total: total || rubro.total,
      incidencePct: rubro.incidencePct,
      sourceSheet: "L8 (14)",
      sourceRow: rubro.sourceRow,
      subItems,
    };
  });

  const grandTotal = rubros.reduce((sum, rubro) => sum + rubro.total, 0);
  return rubros.map((rubro, rubroIndex) => ({
    ...rubro,
    incidencePct:
      grandTotal > 0 ? (rubro.total / grandTotal) * 100 : rubro.incidencePct,
    subItems: rubro.subItems.map((subItem, itemIndex) => ({
      ...subItem,
      sourceRow: subItem.sourceRow ?? itemIndex + 1,
    })),
    sourceRow: rubro.sourceRow ?? rubroIndex + 1,
  }));
}

function parseOffer(sheet: WorkSheet, directCostTotal: number) {
  const generalExpensesPct = percentFromSheet(num(sheet, 13, 6));
  const profitPct = percentFromSheet(num(sheet, 16, 6));
  const taxesPct = percentFromSheet(num(sheet, 19, 6));
  const generalExpensesAmount =
    num(sheet, 13, 8) || directCostTotal * (generalExpensesPct / 100);
  const subtotal2 = directCostTotal + generalExpensesAmount;
  const profitAmount = num(sheet, 16, 8) || subtotal2 * (profitPct / 100);
  const subtotal3 = subtotal2 + profitAmount;
  const taxesAmount = num(sheet, 19, 8) || subtotal3 * (taxesPct / 100);
  const finalPrice = num(sheet, 21, 8) || subtotal3 + taxesAmount;

  return {
    subtotalConstruction: directCostTotal,
    generalExpensesPct,
    generalExpensesAmount,
    profitPct,
    profitAmount,
    taxesPct,
    taxesAmount,
    finalPrice,
  };
}

function parseGeneralExpenses(sheet: WorkSheet) {
  const expenses = [];
  const { maxRow } = getBounds(sheet);
  for (let row = 6; row <= Math.min(maxRow, 80); row += 1) {
    const concept = text(sheet, row, 3);
    if (!concept) continue;
    if (concept.toUpperCase().includes("TOTAL")) continue;

    const monthAmounts = [];
    for (let col = 4; col <= 10; col += 1) {
      monthAmounts.push(num(sheet, row, col));
    }
    expenses.push({
      concept,
      monthAmounts,
      total: num(sheet, row, 11) || monthAmounts.reduce((sum, amount) => sum + amount, 0),
      sortOrder: expenses.length,
    });
  }
  return expenses;
}

function parseWorkPlan(sheet: WorkSheet, finalPrice: number): BudgetWorkPlanRubro[] {
  const rows: BudgetWorkPlanRubro[] = [];
  for (let row = 13; row <= 40; row += 1) {
    const rubroNumber = value(sheet, row, 2);
    const rubroName = text(sheet, row, 3);
    if (!isNumeric(rubroNumber) || !rubroName) continue;

    const monthPercentages = [];
    for (let col = 7; col <= 13; col += 1) {
      monthPercentages.push(percentFromSheet(num(sheet, row, col)));
    }

    rows.push({
      rubroNumber,
      rubroName,
      incidencePct: percentFromSheet(num(sheet, row, 6)),
      monthPercentages,
      cashAmounts: monthPercentages.map((pct) => finalPrice * (pct / 100)),
      sourceSheet: "Plan de Trabajos",
      sourceRow: row,
    });
  }
  return rows;
}

function parseDisbursements(sheet: WorkSheet): BudgetDisbursement[] {
  const rows: BudgetDisbursement[] = [];
  for (let row = 15; row <= 36; row += 1) {
    const label = text(sheet, row, 2);
    const monthMatch = label?.match(/(\d+)/);
    if (!monthMatch) continue;

    const monthNumber = Number(monthMatch[1]);
    rows.push({
      monthNumber,
      nationalAmount: num(sheet, row, 4),
      provincialAmount: num(sheet, row, 5),
      monthlyAmount: num(sheet, row, 6),
      accumulatedAmount: num(sheet, row, 7),
      sourceSheet: "Crono",
      sourceRow: row,
    });
  }
  return rows;
}

function parseTypologies(
  workbook: WorkBook,
  directCostTotal: number,
  finalPrice: number,
  coefficient: number
): BudgetTypology[] {
  const groupSheet = getSheet(workbook, "L8 (14)");
  const prototypeSheet = getSheet(workbook, "L8");
  const quantity = groupSheet ? num(groupSheet, 5, 12) || 1 : 1;

  return [
    {
      code: "L8",
      name: "L8 - 2 Dormitorios",
      quantity,
      directCost: directCostTotal,
      offerPrice: finalPrice,
      coefficient,
      sourceSheet: prototypeSheet ? getSheetName(workbook, "L8") : "L8",
    },
  ];
}

function buildSummary(
  preview: Omit<BudgetExcelImportPreview, "sourceSummary">
): BudgetExcelSourceSummary {
  const materialLineCount = preview.rubros.reduce(
    (sum, rubro) =>
      sum + rubro.subItems.reduce((inner, subItem) => inner + subItem.materials.length, 0),
    0
  );
  const laborLineCount = preview.rubros.reduce(
    (sum, rubro) =>
      sum + rubro.subItems.reduce((inner, subItem) => inner + subItem.labor.length, 0),
    0
  );
  const directCostTotal = preview.rubros.reduce((sum, rubro) => sum + rubro.total, 0);
  const finalPrice = preview.offerStructure?.finalPrice ?? directCostTotal;

  return {
    rubroCount: preview.rubros.length,
    itemCount: preview.rubros.reduce((sum, rubro) => sum + rubro.subItems.length, 0),
    materialLineCount,
    laborLineCount,
    insumoCount: preview.insumos.length,
    generalExpenseCount: preview.generalExpenses.length,
    directCostTotal,
    finalPrice,
    coefficient: directCostTotal > 0 ? finalPrice / directCostTotal : 0,
    workPlanMonthCount: preview.workPlan[0]?.monthPercentages.length ?? 0,
    disbursementCount: preview.disbursements.length,
    externalFormulaRefCount: preview.warnings.filter(
      (warning) => warning.code === "external_formula_ref"
    ).length,
    formulaErrorCount: preview.warnings.filter(
      (warning) => warning.code === "formula_error"
    ).length,
  };
}

export function parseBudgetExcelWorkbook(
  workbook: WorkBook,
  meta: { fileName: string; fileSize: number }
): BudgetExcelImportPreview {
  const warnings: BudgetExcelWarning[] = [];

  for (const sheetName of REQUIRED_SHEETS) {
    if (!getSheet(workbook, sheetName)) {
      warnings.push(
        makeWarning(
          "error",
          "missing_sheet",
          `No se encontro la hoja requerida "${sheetName}".`,
          { sheetName }
        )
      );
    }
  }

  const scan = scanWorkbook(workbook);
  warnings.push(...scan.warnings);

  const analysisSheet = getSheet(workbook, "ANALISIS DE PRECIOS");
  const groupSheet = getSheet(workbook, "L8 (14)");
  const offerSheet = getSheet(workbook, "Estr-Ofer");
  const insumosSheet = getSheet(workbook, "INSUMOS");
  const laborSheet = getSheet(workbook, "MO");
  const expensesSheet = getSheet(workbook, "G.G");
  const workPlanSheet = getSheet(workbook, "Plan de Trabajos");
  const cronoSheet = getSheet(workbook, "Crono");

  const analysis = analysisSheet ? parseAnalysis(analysisSheet) : new Map();
  const group = groupSheet ? parseGroupSheet(groupSheet) : { rubros: [], items: [] };
  const rubros = buildRubros(group, analysis);
  const directCostTotal = rubros.reduce((sum, rubro) => sum + rubro.total, 0);
  const offerStructure = offerSheet ? parseOffer(offerSheet, directCostTotal) : null;
  const finalPrice = offerStructure?.finalPrice ?? directCostTotal;
  const coefficient = directCostTotal > 0 ? finalPrice / directCostTotal : 0;

  if (rubros.length === 0) {
    warnings.push(
      makeWarning(
        "error",
        "empty_computo",
        "No se detectaron rubros e items importables en la hoja L8 (14)."
      )
    );
  }

  const previewWithoutSummary: Omit<BudgetExcelImportPreview, "sourceSummary"> = {
    fileName: meta.fileName,
    fileSize: meta.fileSize,
    sheetNames: workbook.SheetNames,
    rubros,
    offerStructure,
    laborRates: laborSheet ? parseLaborRates(laborSheet) : [],
    generalExpenses: expensesSheet ? parseGeneralExpenses(expensesSheet) : [],
    insumos: insumosSheet ? parseInsumos(insumosSheet) : [],
    typologies: parseTypologies(workbook, directCostTotal, finalPrice, coefficient),
    workPlan: workPlanSheet ? parseWorkPlan(workPlanSheet, finalPrice) : [],
    disbursements: cronoSheet ? parseDisbursements(cronoSheet) : [],
    warnings,
  };

  const summary = buildSummary(previewWithoutSummary);
  summary.externalFormulaRefCount = scan.externalFormulaRefCount;
  summary.formulaErrorCount = scan.formulaErrorCount;

  return {
    ...previewWithoutSummary,
    sourceSummary: summary,
  };
}

export function parseBudgetExcelArrayBuffer(
  buffer: ArrayBuffer,
  meta: { fileName: string; fileSize: number }
) {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellFormula: true,
    cellNF: false,
    cellStyles: false,
    cellDates: false,
  });

  return parseBudgetExcelWorkbook(workbook, meta);
}

export async function parseBudgetExcelFile(file: File) {
  const buffer = await file.arrayBuffer();
  return parseBudgetExcelArrayBuffer(buffer, {
    fileName: file.name,
    fileSize: file.size,
  });
}
