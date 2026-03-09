"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import {
    BudgetVersion,
    BUDGET_CATEGORY_LABELS,
    itemTotalPlanned,
    itemTotalActual,
} from "@/lib/types/budget";

interface BudgetPdfExportProps {
    version: BudgetVersion;
    projectId: string;
}

const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);

export function BudgetPdfExport({ version, projectId }: BudgetPdfExportProps) {
    const handlePrint = () => {
        const totalPlanned = version.items.reduce((s, i) => s + itemTotalPlanned(i), 0);
        const totalActual = version.items.reduce((s, i) => s + itemTotalActual(i), 0);
        const deviation = totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0;

        // Group items by category
        const grouped: Record<string, typeof version.items> = {};
        version.items.forEach((item) => {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        });

        const rows = Object.entries(grouped)
            .map(([cat, items]) => {
                const catLabel = BUDGET_CATEGORY_LABELS[cat as keyof typeof BUDGET_CATEGORY_LABELS];
                const catPlanned = items.reduce((s, i) => s + itemTotalPlanned(i), 0);
                const catActual = items.reduce((s, i) => s + itemTotalActual(i), 0);
                const catDev = catPlanned > 0 ? ((catActual - catPlanned) / catPlanned) * 100 : 0;

                const itemRows = items
                    .map(
                        (i) => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;padding-left:24px;">${i.description}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.unit}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${i.qtyPlanned}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.priceUnitPlanned)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${fmt(itemTotalPlanned(i))}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${i.qtyActual}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${fmt(itemTotalActual(i))}</td>
          </tr>`
                    )
                    .join("");

                return `
          <tr style="background:#f8f9fa;">
            <td colspan="4" style="padding:8px;font-weight:700;color:#333;">${catLabel}</td>
            <td style="padding:8px;text-align:right;font-weight:700;">${fmt(catPlanned)}</td>
            <td style="padding:8px;"></td>
            <td style="padding:8px;text-align:right;font-weight:700;color:${catDev > 10 ? "#dc2626" : catDev > 0 ? "#d97706" : "#16a34a"};">${fmt(catActual)}</td>
          </tr>
          ${itemRows}`;
            })
            .join("");

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Presupuesto ${version.label} - Proyecto #${projectId}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 32px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; color: #555; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1e293b; color: white; padding: 8px; text-align: right; font-size: 11px; }
          th:first-child, th:nth-child(2) { text-align: left; }
          .summary { display: flex; gap: 32px; margin-top: 20px; padding: 16px; background: #f1f5f9; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 11px; color: #666; }
          .summary-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>ArquiManagerPro — Presupuesto del Proyecto</h1>
        <h2>${version.label} · ${version.description} · Proyecto #${projectId}</h2>
        <p style="color:#888;font-size:11px;">Generado el ${new Date().toLocaleDateString("es-AR")} · ${version.items.length} ítems</p>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Presupuestado</div>
            <div class="summary-value">${fmt(totalPlanned)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Ejecutado</div>
            <div class="summary-value">${fmt(totalActual)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Desviación</div>
            <div class="summary-value" style="color:${deviation > 10 ? "#dc2626" : deviation > 0 ? "#d97706" : "#16a34a"}">
              ${deviation >= 0 ? "+" : ""}${deviation.toFixed(1)}%
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Saldo Disponible</div>
            <div class="summary-value" style="color:${totalPlanned - totalActual >= 0 ? "#16a34a" : "#dc2626"}">${fmt(totalPlanned - totalActual)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align:left">Categoría / Descripción</th>
              <th style="text-align:center">Unidad</th>
              <th>Cant. Plan.</th>
              <th>P.U. Plan.</th>
              <th>Total Plan.</th>
              <th>Cant. Real</th>
              <th>Total Real</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#1e293b;color:white;font-weight:700;">
              <td colspan="4" style="padding:10px;">TOTAL GENERAL</td>
              <td style="padding:10px;text-align:right;">${fmt(totalPlanned)}</td>
              <td style="padding:10px;"></td>
              <td style="padding:10px;text-align:right;">${fmt(totalActual)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
        </Button>
    );
}
