"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDocumentsProps {
  projectId: string;
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const documents = [
    {
      name: "Planos Arquitectónicos",
      type: "PDF",
      size: "12.5 MB",
      date: "15/03/2024",
    },
    {
      name: "Especificaciones Técnicas",
      type: "DOC",
      size: "2.8 MB",
      date: "16/03/2024",
    },
    {
      name: "Presupuesto Detallado",
      type: "XLS",
      size: "1.5 MB",
      date: "17/03/2024",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.type} • {doc.size} • {doc.date}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}