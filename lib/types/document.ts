export type DocumentType = "pdf" | "image" | "plan" | "spreadsheet" | "other";

export type ProjectStage =
    | "general"
    | "foundations"
    | "structure"
    | "enclosures"
    | "installations"
    | "finishes"
    | "delivery";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    pdf: "PDF",
    image: "Imagen",
    plan: "Plano",
    spreadsheet: "Planilla",
    other: "Otro",
};

export const STAGE_LABELS: Record<ProjectStage, string> = {
    general: "General",
    foundations: "Cimentación",
    structure: "Estructura",
    enclosures: "Cerramientos",
    installations: "Instalaciones",
    finishes: "Terminaciones",
    delivery: "Entrega",
};

export interface ProjectDocument {
    id: string;
    name: string;
    type: DocumentType;
    stage: ProjectStage;
    version: string;
    fileUrl: string; // URL pública de Supabase
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    description: string;
    isPhoto: boolean;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mimeToDocType(mimeType: string): DocumentType {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType === "application/acad" || mimeType === "image/vnd.dwg")
        return "plan";
    if (mimeType.startsWith("image/")) return "image";
    if (
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
    )
        return "spreadsheet";
    return "other";
}
