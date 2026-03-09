"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trash2, ZoomIn, Camera } from "lucide-react";
import { ProjectDocument, STAGE_LABELS, ProjectStage } from "@/lib/types/document";

interface PhotosGalleryProps {
    photos: ProjectDocument[];
    onDelete: (id: string) => void;
}

const STAGES = Object.keys(STAGE_LABELS) as ProjectStage[];

export function PhotosGallery({ photos, onDelete }: PhotosGalleryProps) {
    const [activeStage, setActiveStage] = useState<string>("all");
    const [lightboxPhoto, setLightboxPhoto] = useState<ProjectDocument | null>(null);

    const filtered =
        activeStage === "all" ? photos : photos.filter((p) => p.stage === activeStage);

    const stagesWithPhotos = STAGES.filter((s) => photos.some((p) => p.stage === s));

    if (photos.length === 0) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <Camera className="mx-auto h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No hay fotos de avance aún.</p>
                <p className="text-xs mt-1">
                    Subí imágenes y marcalas como &quot;Foto de avance de obra&quot; en el formulario de carga.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Stage filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                    variant={activeStage === "all" ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1 text-xs"
                    onClick={() => setActiveStage("all")}
                >
                    Todas ({photos.length})
                </Badge>
                {stagesWithPhotos.map((s) => {
                    const count = photos.filter((p) => p.stage === s).length;
                    return (
                        <Badge
                            key={s}
                            variant={activeStage === s ? "default" : "outline"}
                            className="cursor-pointer px-3 py-1 text-xs"
                            onClick={() => setActiveStage(s)}
                        >
                            {STAGE_LABELS[s]} ({count})
                        </Badge>
                    );
                })}
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo.fileUrl}
                            alt={photo.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        {/* Bottom info */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <p className="text-white text-xs font-medium truncate">{photo.name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-white/70 text-xs">{STAGE_LABELS[photo.stage]}</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 text-white/70 hover:text-red-400"
                                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            <Dialog open={!!lightboxPhoto} onOpenChange={(open) => { if (!open) setLightboxPhoto(null); }}>
                <DialogContent className="sm:max-w-[800px] p-2">
                    {lightboxPhoto && (
                        <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={lightboxPhoto.fileUrl}
                                alt={lightboxPhoto.name}
                                className="w-full max-h-[70vh] object-contain rounded"
                            />
                            <div className="flex items-center justify-between px-2 pb-1">
                                <div>
                                    <p className="text-sm font-medium">{lightboxPhoto.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {STAGE_LABELS[lightboxPhoto.stage]} ·{" "}
                                        {new Date(lightboxPhoto.uploadedAt).toLocaleDateString("es-AR")}
                                    </p>
                                    {lightboxPhoto.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{lightboxPhoto.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
