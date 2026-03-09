"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectDocument } from "@/lib/types/document";
import { getDocumentsByProject, uploadDocument, deleteDocument } from "@/lib/api/documents";
import { DocumentsStats } from "./documents-stats";
import { DocumentsUploadZone } from "./documents-upload-zone";
import { DocumentsLibrary } from "./documents-library";
import { PhotosGallery } from "./photos-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Camera, Loader2 } from "lucide-react";

interface DocumentsModuleProps {
    projectId: string;
}

// Local Storage functions removed since we are now using Supabase DB

export function DocumentsModule({ projectId }: DocumentsModuleProps) {
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const docs = await getDocumentsByProject(parseInt(projectId));
            setDocuments(docs);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "No se pudieron cargar los documentos");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleUpload = async (
        file: File,
        metadata: Omit<ProjectDocument, "id" | "fileUrl" | "uploadedAt" | "mimeType" | "sizeBytes">
    ) => {
        const newDoc = await uploadDocument(file, parseInt(projectId), metadata);
        setDocuments((prev) => [newDoc, ...prev]);
    };

    const handleDelete = async (id: string) => {
        const docToDelete = documents.find((d) => d.id === id);
        if (!docToDelete) return;

        try {
            // Optimistic update
            setDocuments((prev) => prev.filter((d) => d.id !== id));
            await deleteDocument(id, docToDelete.fileUrl || "");
        } catch (err) {
            console.error(err);
            // Revert on error
            setDocuments((prev) => [...prev, docToDelete]);
            alert("Error al eliminar el documento.");
        }
    };

    const photos = documents.filter((d) => d.isPhoto);

    if (isLoading) {
        return (
            <div className="mt-6 flex flex-col items-center justify-center py-20 text-muted-foreground text-sm gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                Cargando documentos desde Supabase...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-6 flex items-center justify-center p-6 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                {error}
                <div className="ml-4 text-xs opacity-70">
                    Aviso: Recuerda crear el Bucket &apos;documents&apos; y correr `supabase/sql/001_init_projects_documents.sql` en Supabase.
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 flex flex-col gap-6 animate-fadeIn">
            {/* KPI Stats */}
            <DocumentsStats documents={documents} />

            {/* Upload zone */}
            <DocumentsUploadZone onUpload={handleUpload} />

            {/* Biblioteca / Fotos sub-tabs */}
            <Tabs defaultValue="library">
                <TabsList>
                    <TabsTrigger value="library" className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Biblioteca
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                            {documents.filter((d) => !d.isPhoto).length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Fotos de Obra
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                            {photos.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="mt-4">
                    <DocumentsLibrary documents={documents} onDelete={handleDelete} />
                </TabsContent>

                <TabsContent value="photos" className="mt-4">
                    <PhotosGallery photos={photos} onDelete={handleDelete} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
