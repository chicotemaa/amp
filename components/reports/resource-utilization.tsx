"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { getResourceUtilization } from "@/lib/api/employees";

ChartJS.register(ArcElement, Tooltip, Legend);

const DEPT_COLORS: Record<string, string> = {
  Diseño: "#3b82f6",      // Blue
  Ingeniería: "#f59e0b",  // Amber
  Construcción: "#10b981",// Emerald
  Gestión: "#8b5cf6",     // Violet
};

// Colors for the chart segments (slightly more opaque if needed)
const CHART_COLORS: Record<string, string> = {
  Diseño: "#2563eb",
  Ingeniería: "#d97706",
  Construcción: "#059669",
  Gestión: "#7c3aed",
};

export function ResourceUtilization() {
  const resources = getResourceUtilization();

  const data: ChartData<"doughnut"> = {
    labels: resources.map((r) => r.label),
    datasets: [
      {
        data: resources.map((r) => r.percentage),
        backgroundColor: resources.map((r) => CHART_COLORS[r.department] ?? "#888"),
        hoverBackgroundColor: resources.map((r) => DEPT_COLORS[r.department] ?? "#888"),
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="h-[300px] flex items-center justify-center">
        <Doughnut
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {resources.map((r) => (
          <div
            key={r.department}
            className="space-y-1 p-4 rounded-lg"
            style={{ backgroundColor: `${DEPT_COLORS[r.department]}20` }}
          >
            <div className="font-medium">{r.label}</div>
            <div className="text-muted-foreground space-y-0.5">
              <div>{r.percentage}% del equipo</div>
              <div>{r.hoursAssigned} horas asignadas</div>
              <div>{r.count} {r.count === 1 ? "miembro" : "miembros"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}