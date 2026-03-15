"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReportsDb } from "@/lib/api/reports";
import type { Report } from "@/lib/types/report";
import { REPORT_STATUS_LABELS } from "@/lib/types/report";

const statusStyles = {
  completed: "bg-green-500/10 text-green-600 border-green-200",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  "in-review": "bg-blue-500/10 text-blue-600 border-blue-200",
};

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getReportsDb()
      .then((reportsData) => {
        if (!mounted) return;
        setReports(reportsData.slice(0, 3));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando reportes...</p>
        ) : (
          <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center space-x-4">
              <div className="flex-1 space-y-0.5 min-w-0">
                <p className="text-sm font-medium">{report.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {report.projectName} · {report.authorName}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-xs ${statusStyles[report.status]}`}
              >
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
