"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, GitBranch, CheckCircle2 } from "lucide-react";
import { BudgetVersion, itemTotalPlanned } from "@/lib/types/budget";
import { cn } from "@/lib/utils";

interface BudgetVersionHistoryProps {
    versions: BudgetVersion[];
    activeVersionId: string;
    onActivate: (id: string) => void;
    onNewVersion: () => void;
}

const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);

export function BudgetVersionHistory({
    versions,
    activeVersionId,
    onActivate,
    onNewVersion,
}: BudgetVersionHistoryProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Historial de Versiones</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={onNewVersion}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Nueva versión
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[320px] pr-3">
                    <div className="space-y-3">
                        {[...versions].reverse().map((v, idx) => {
                            const isActive = v.id === activeVersionId;
                            const total = v.items.reduce((s, i) => s + itemTotalPlanned(i), 0);
                            return (
                                <div key={v.id}>
                                    <div
                                        className={cn(
                                            "flex items-center justify-between rounded-lg border p-3 transition-colors",
                                            isActive
                                                ? "border-primary/40 bg-primary/5"
                                                : "hover:bg-muted/40 cursor-pointer"
                                        )}
                                        onClick={() => !isActive && onActivate(v.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 rounded-full p-1",
                                                    isActive ? "bg-primary/20" : "bg-muted"
                                                )}
                                            >
                                                {isActive ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                                ) : (
                                                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{v.label}</span>
                                                    {isActive && (
                                                        <Badge className="text-xs h-5">Activa</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {v.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(v.createdAt).toLocaleDateString("es-AR", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                    {" · "}
                                                    <span className="font-medium text-foreground">{fmt(total)}</span>
                                                    {" · "}
                                                    {v.items.length} ítems
                                                </p>
                                            </div>
                                        </div>
                                        {!isActive && (
                                            <Button size="sm" variant="ghost" className="text-xs shrink-0">
                                                Activar
                                            </Button>
                                        )}
                                    </div>
                                    {idx < versions.length - 1 && <Separator className="my-1" />}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
