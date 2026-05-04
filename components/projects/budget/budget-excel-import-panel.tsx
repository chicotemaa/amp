"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseBudgetExcelFile } from "@/lib/budget-computo/excel-parser";
import type { BudgetExcelImportPreview } from "@/lib/types/budget-excel";

interface BudgetExcelImportPanelProps {
  onImport: (preview: BudgetExcelImportPreview) => Promise<void>;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const number = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);

export function BudgetExcelImportPanel({ onImport }: BudgetExcelImportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<BudgetExcelImportPreview | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockingErrors = preview?.warnings.filter((warning) => warning.severity === "error") ?? [];
  const warningCount = preview?.warnings.filter((warning) => warning.severity === "warning").length ?? 0;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreview(null);
    setIsParsing(true);

    try {
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        throw new Error("El archivo debe ser .xlsx o .xls.");
      }
      const nextPreview = await parseBudgetExcelFile(file);
      setPreview(nextPreview);
      if (nextPreview.warnings.some((warning) => warning.severity === "error")) {
        toast.error("El Excel tiene errores bloqueantes para importar.");
      } else if (nextPreview.warnings.length > 0) {
        toast.warning("Excel analizado con advertencias.");
      } else {
        toast.success("Excel analizado correctamente.");
      }
    } catch (err: any) {
      setError(err?.message ?? "No se pudo analizar el Excel.");
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!preview || blockingErrors.length > 0) return;
    setIsSaving(true);
    try {
      await onImport(preview);
      setPreview(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Importar Cómputo Excel</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Preview validado antes de reemplazar la versión activa.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isParsing || isSaving}
        >
          {isParsing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Analizar Excel
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de lectura</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!preview && !error && (
          <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Sin archivo analizado.
          </div>
        )}

        {preview && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Rubros / ítems</p>
                <p className="mt-1 text-lg font-semibold">
                  {preview.sourceSummary.rubroCount} / {preview.sourceSummary.itemCount}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Insumos</p>
                <p className="mt-1 text-lg font-semibold">
                  {preview.sourceSummary.insumoCount}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Costo directo</p>
                <p className="mt-1 text-lg font-semibold">
                  {money(preview.sourceSummary.directCostTotal)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Precio final</p>
                <p className="mt-1 text-lg font-semibold">
                  {money(preview.sourceSummary.finalPrice)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">
                {preview.sheetNames.length} hojas
              </Badge>
              <Badge variant="outline">
                {preview.sourceSummary.materialLineCount} materiales
              </Badge>
              <Badge variant="outline">
                {preview.sourceSummary.laborLineCount} líneas MO
              </Badge>
              <Badge variant="outline">
                Coef. {number(preview.sourceSummary.coefficient)}
              </Badge>
              {warningCount > 0 && (
                <Badge variant="secondary">{warningCount} advertencias</Badge>
              )}
              {blockingErrors.length > 0 && (
                <Badge variant="destructive">{blockingErrors.length} errores</Badge>
              )}
            </div>

            {preview.warnings.length > 0 && (
              <div className="rounded-md border">
                <div className="border-b px-3 py-2 text-sm font-medium">
                  Validaciones
                </div>
                <div className="max-h-52 overflow-y-auto divide-y">
                  {preview.warnings.slice(0, 12).map((warning, index) => (
                    <div key={`${warning.code}-${index}`} className="px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{warning.message}</span>
                        <Badge
                          variant={
                            warning.severity === "error"
                              ? "destructive"
                              : warning.severity === "warning"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {warning.severity}
                        </Badge>
                      </div>
                      {(warning.sheetName || warning.cell) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {warning.sheetName}
                          {warning.cell ? ` ${warning.cell}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{preview.fileName}</span>
              </div>
              <Button
                onClick={handleImport}
                disabled={isSaving || blockingErrors.length > 0}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar y reemplazar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
