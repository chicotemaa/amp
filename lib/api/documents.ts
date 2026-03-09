import { supabase } from "@/lib/supabase";
import { DocumentType, ProjectDocument, ProjectStage } from "@/lib/types/document";
import type { Database } from "@/lib/types/supabase";

const BUCKET_NAME = "documents";
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export async function getDocumentsByProject(projectId: number): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        throw new Error("No se pudieron cargar los documentos");
    }

    // Map DB fields to TS interfaces
    return (data as DocumentRow[]).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type as DocumentType,
        stage: doc.stage as ProjectStage,
        version: doc.version,
        fileUrl: doc.file_url,
        mimeType: doc.mime_type,
        sizeBytes: doc.size_bytes,
        description: doc.description || "",
        isPhoto: doc.is_photo,
        uploadedAt: doc.uploaded_at,
    }));
}

export async function uploadDocument(
    file: File,
    projectId: number,
    metadata: Omit<ProjectDocument, "id" | "fileUrl" | "uploadedAt" | "mimeType" | "sizeBytes">
): Promise<ProjectDocument> {
    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${metadata.stage}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("Error al subir el archivo físico");
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    // 3. Insert record into Postgres
    const { data: docRecord, error: dbError } = await supabase
        .from("documents")
        .insert({
            name: metadata.name,
            type: metadata.type,
            stage: metadata.stage,
            version: metadata.version,
            file_url: publicUrl,
            mime_type: file.type,
            size_bytes: file.size,
            description: metadata.description || null,
            is_photo: metadata.isPhoto,
            project_id: projectId
        })
        .select()
        .single();

    if (dbError) {
        console.error("DB insert error:", dbError);
        // Best effort to clean up the orphaned file
        await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        throw new Error("Error al guardar los datos del documento");
    }

    const record = docRecord as DocumentRow;

    return {
        id: record.id,
        name: record.name,
        type: record.type as DocumentType,
        stage: record.stage as ProjectStage,
        version: record.version,
        fileUrl: record.file_url,
        mimeType: record.mime_type,
        sizeBytes: record.size_bytes,
        description: record.description || "",
        isPhoto: record.is_photo,
        uploadedAt: record.uploaded_at,
    };
}

export async function deleteDocument(id: string, fileUrl: string): Promise<void> {
    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

    if (dbError) {
        console.error("DB delete error:", dbError);
        throw new Error("Error al eliminar el documento de la base de datos");
    }

    // 2. Extract path from public URL and delete from Storage
    // The public URL looks like: https://[ref].supabase.co/storage/v1/object/public/documents/1/general/123-abc.pdf
    try {
        const urlParts = fileUrl.split(`/public/${BUCKET_NAME}/`);
        if (urlParts.length === 2) {
            const filePath = urlParts[1];
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        }
    } catch (e) {
        console.error("Failed to delete file from storage. The DB record was deleted.", e);
    }
}
