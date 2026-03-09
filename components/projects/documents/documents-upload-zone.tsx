"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, FileUp, X } from "lucide-react";
import {
    ProjectDocument,
    DocumentType,
    ProjectStage,
    DOCUMENT_TYPE_LABELS,
    STAGE_LABELS,
    mimeToDocType,
    formatFileSize,
} from "@/lib/types/document";
import { cn } from "@/lib/utils";

interface DocumentsUploadZoneProps {
    onUpload: (
        file: File,
        doc: Omit<ProjectDocument, "id" | "fileUrl" | "uploadedAt" | "mimeType" | "sizeBytes">
    ) => Promise<void>;
}

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.dwg,.xlsx,.xls";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/acad",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".dwg", ".xlsx", ".xls"];

function sanitizeDocumentName(name: string) {
    return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
}

export function DocumentsUploadZone({ onUpload }: DocumentsUploadZoneProps) {
    const [dragging, setDragging] = useState(false);
    const [pending, setPending] = useState<File | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        type: "pdf" as DocumentType,
        stage: "general" as ProjectStage,
        version: "1.0",
        description: "",
        isPhoto: false,
    });
    const [fileData, setFileData] = useState<{ data: string; mime: string; size: number } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        const lowerName = file.name.toLowerCase();
        const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setUploadError("El archivo supera el límite de 20 MB.");
            return;
        }
        if (!ALLOWED_MIME_TYPES.has(file.type) && !hasAllowedExtension) {
            setUploadError("Tipo de archivo no permitido.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result as string;
            const docType = mimeToDocType(file.type);
            setUploadError(null);
            setFileData({ data, mime: file.type, size: file.size });
            setForm((f) => ({
                ...f,
                name: sanitizeDocumentName(file.name.replace(/\.[^.]+$/, "")),
                type: docType,
                isPhoto: docType === "image",
            }));
            setPending(file);
            setDialogOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = "";
    };

    const handleUpload = async () => {
        if (!pending || !form.name.trim()) return;
        const safeName = sanitizeDocumentName(form.name);
        if (!safeName) {
            setUploadError("El nombre del documento no es válido.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            await onUpload(pending, {
                name: safeName,
                type: form.type,
                stage: form.stage,
                version: form.version,
                description: form.description,
                isPhoto: form.isPhoto,
            });

            setDialogOpen(false);
            setPending(null);
            setFileData(null);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : "Error al subir el documento.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
                    dragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <div className={cn("rounded-full p-4 transition-colors", dragging ? "bg-primary/20" : "bg-muted")}>
                    <Upload className={cn("h-6 w-6", dragging ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">
                        {dragging ? "Soltá el archivo aquí" : "Arrastrá archivos o hacé clic para seleccionar"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        PDF · Imágenes · Planos DWG · Excel — Máx. 20 MB
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                    <FileUp className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                </Button>
                <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleChange} />
            </div>
            {uploadError && (
                <p className="mt-2 text-sm text-destructive">{uploadError}</p>
            )}

            <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setPending(null); } setDialogOpen(v); }}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Configurar documento</DialogTitle>
                    </DialogHeader>

                    {pending && (
                        <div className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm">
                            <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate font-medium">{pending.name}</span>
                            <span className="text-muted-foreground shrink-0">{formatFileSize(pending.size)}</span>
                        </div>
                    )}

                    <div className="grid gap-4 py-1">
                        <div className="space-y-1.5">
                            <Label>Nombre del documento *</Label>
                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Tipo</Label>
                                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as DocumentType }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Versión</Label>
                                <Input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} placeholder="1.0" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Etapa del proyecto</Label>
                            <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v as ProjectStage }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STAGE_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descripción (opcional)</Label>
                            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Notas sobre este documento..." />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Foto de avance de obra</p>
                                <p className="text-xs text-muted-foreground">Se mostrará en la galería de fotos</p>
                            </div>
                            <Switch checked={form.isPhoto} onCheckedChange={(v) => setForm((f) => ({ ...f, isPhoto: v }))} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUploading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={!form.name.trim() || isUploading}>
                            {isUploading ? (
                                <>Subiendo...</>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir documento
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
