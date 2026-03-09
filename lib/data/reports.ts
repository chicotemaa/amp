import { Report } from "@/lib/types/report";

/**
 * Canonical reports data.
 * projectName matches canonical projects. authorName matches canonical employees.
 */
export const REPORTS: Report[] = [
    {
        id: 1,
        title: "Avance estructural — Mes 3",
        projectId: 1,
        projectName: "Torre Residencial Marina",
        date: "2024-03-15",
        status: "completed",
        authorId: 2,
        authorName: "Ana García",
    },
    {
        id: 2,
        title: "Informe de cimentación",
        projectId: 3,
        projectName: "Complejo Deportivo Olímpico",
        date: "2024-03-14",
        status: "in-review",
        authorId: 7,
        authorName: "Pablo Hernández",
    },
    {
        id: 3,
        title: "Planificación inicial aprobada",
        projectId: 4,
        projectName: "Hospital Metropolitano",
        date: "2024-03-13",
        status: "pending",
        authorId: 5,
        authorName: "Diego Morales",
    },
    {
        id: 4,
        title: "Entrega final — Documentación",
        projectId: 5,
        projectName: "Eco-Resort Costa Verde",
        date: "2024-03-01",
        status: "completed",
        authorId: 1,
        authorName: "Carlos Rodríguez",
    },
    {
        id: 5,
        title: "Avance de obra — Semana 24",
        projectId: 6,
        projectName: "Campus Universitario Tech",
        date: "2024-02-28",
        status: "completed",
        authorId: 5,
        authorName: "Diego Morales",
    },
];
