"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FileText,
    Image,
    LayoutGrid,
    FileSpreadsheet,
    File,
    MoreVertical,
    Eye,
    Download,
    Trash2,
    Search,
} from "lucide-react";
import {
    ProjectDocument,
    DocumentType,
    ProjectStage,
    DOCUMENT_TYPE_LABELS,
    STAGE_LABELS,
    formatFileSize,
} from "@/lib/types/document";
import { DocumentPreviewDialog } from "./document-preview-dialog";
import { cn } from "@/lib/utils";

interface DocumentsLibraryProps {
    documents: ProjectDocument[];
    onDelete: (id: string) => void;
}

const TYPE_ICON: Record<DocumentType, React.ElementType> = {
    pdf: FileText,
    image: Image,
    plan: LayoutGrid,
    spreadsheet: FileSpreadsheet,
    other: File,
};

const TYPE_COLORS: Record<DocumentType, string> = {
    pdf: "text-red-500 bg-red-500/10",
    image: "text-blue-500 bg-blue-500/10",
    plan: "text-orange-500 bg-orange-500/10",
    spreadsheet: "text-green-500 bg-green-500/10",
    other: "text-gray-500 bg-gray-500/10",
};

export function DocumentsLibrary({ documents, onDelete }: DocumentsLibraryProps) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStage, setFilterStage] = useState<string>("all");
    const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

    const nonPhotos = documents.filter((d) => !d.isPhoto);

    const filtered = nonPhotos.filter((d) => {
        const matchSearch =
            !search || d.name.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === "all" || d.type === filterType;
        const matchStage = filterStage === "all" || d.stage === filterStage;
        return matchSearch && matchType && matchStage;
    });

    const handleDownload = (doc: ProjectDocument) => {
        const link = window.document.createElement("a");
        link.href = doc.fileUrl;
        link.download = doc.name;
        link.click();
    };

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Buscar documentos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las etapas</SelectItem>
                        {Object.entries(STAGE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Document grid */}
            {filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                    <FileText className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">
                        {nonPhotos.length === 0
                            ? "No hay documentos subidos aún. Usá la zona de carga arriba."
                            : "No se encontraron documentos con estos filtros."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((doc) => {
                        const Icon = TYPE_ICON[doc.type];
                        const colorClass = TYPE_COLORS[doc.type];
                        return (
                            <div
                                key={doc.id}
                                className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm hover:border-primary/30 cursor-pointer"
                                onClick={() => setPreviewDoc(doc)}
                            >
                                <div className={cn("rounded-lg p-2.5 shrink-0", colorClass)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                                            {STAGE_LABELS[doc.stage]}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">v{doc.version}</span>
                                        <span className="text-xs text-muted-foreground">{formatFileSize(doc.sizeBytes)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(doc.uploadedAt).toLocaleDateString("es-AR")}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Descargar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })}
                </div>
            )}

            <DocumentPreviewDialog
                document={previewDoc}
                onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
            />
        </>
    );
}
