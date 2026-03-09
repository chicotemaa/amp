"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, LayoutGrid, Clock } from "lucide-react";
import { ProjectDocument } from "@/lib/types/document";
import { cn } from "@/lib/utils";

interface DocumentsStatsProps {
    documents: ProjectDocument[];
}

export function DocumentsStats({ documents }: DocumentsStatsProps) {
    const photos = documents.filter((d) => d.isPhoto);
    const nonPhotos = documents.filter((d) => !d.isPhoto);
    const plans = documents.filter((d) => d.type === "plan");

    const lastUploaded = documents.reduce<ProjectDocument | null>((latest, d) => {
        if (!latest) return d;
        return new Date(d.uploadedAt) > new Date(latest.uploadedAt) ? d : latest;
    }, null);

    const lastDate = lastUploaded
        ? new Date(lastUploaded.uploadedAt).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
        })
        : "—";

    const stats = [
        {
            title: "Total Documentos",
            value: String(nonPhotos.length),
            description: "archivos en biblioteca",
            icon: FileText,
            color: "text-blue-500",
        },
        {
            title: "Planos",
            value: String(plans.length),
            description: "planos técnicos",
            icon: LayoutGrid,
            color: "text-orange-500",
        },
        {
            title: "Fotos de Avance",
            value: String(photos.length),
            description: "fotos de obra",
            icon: Image,
            color: "text-green-500",
        },
        {
            title: "Última Subida",
            value: lastDate,
            description: lastUploaded?.name ?? "Sin documentos aún",
            icon: Clock,
            color: "text-purple-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
                const Icon = s.icon;
                return (
                    <Card key={s.title} className="card-modern">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                            <Icon className={cn("h-4 w-4", s.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{s.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
