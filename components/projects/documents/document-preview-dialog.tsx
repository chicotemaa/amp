"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, LayoutGrid, FileSpreadsheet, File } from "lucide-react";
import { ProjectDocument, formatFileSize } from "@/lib/types/document";

interface DocumentPreviewDialogProps {
    document: ProjectDocument | null;
    onOpenChange: (open: boolean) => void;
}

function DocTypeIcon({ type, className }: { type: ProjectDocument["type"]; className?: string }) {
    switch (type) {
        case "pdf":
            return <FileText className={className} />;
        case "plan":
            return <LayoutGrid className={className} />;
        case "spreadsheet":
            return <FileSpreadsheet className={className} />;
        default:
            return <File className={className} />;
    }
}

export function DocumentPreviewDialog({ document, onOpenChange }: DocumentPreviewDialogProps) {
    const open = !!document;

    const handleDownload = () => {
        if (!document) return;
        const link = window.document.createElement("a");
        link.href = document.fileUrl;
        link.download = document.name;
        link.click();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[780px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="truncate pr-8">{document?.name}</DialogTitle>
                </DialogHeader>

                {document && (
                    <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
                        {/* Meta info */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Tipo: <strong className="text-foreground">{document.type.toUpperCase()}</strong></span>
                            <span>Versión: <strong className="text-foreground">v{document.version}</strong></span>
                            <span>Tamaño: <strong className="text-foreground">{formatFileSize(document.sizeBytes)}</strong></span>
                            <span>
                                Subido:{" "}
                                <strong className="text-foreground">
                                    {new Date(document.uploadedAt).toLocaleDateString("es-AR")}
                                </strong>
                            </span>
                        </div>

                        {/* Preview area */}
                        <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
                            {document.mimeType === "application/pdf" ? (
                                <iframe
                                    src={document.fileUrl}
                                    className="w-full h-full min-h-[400px]"
                                    title={document.name}
                                />
                            ) : document.mimeType.startsWith("image/") ? (
                                <div className="flex items-center justify-center h-full min-h-[400px] p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={document.fileUrl}
                                        alt={document.name}
                                        className="max-h-[500px] max-w-full object-contain rounded"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[240px] gap-4">
                                    <DocTypeIcon type={document.type} className="h-16 w-16 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Este tipo de archivo no puede previsualizarse en el navegador.
                                    </p>
                                </div>
                            )}
                        </div>

                        {document.description && (
                            <p className="text-sm text-muted-foreground">{document.description}</p>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
