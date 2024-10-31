"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const resourceData = {
  architecture: {
    percentage: 35,
    hours: 560,
    team: 12,
    color: "hsl(var(--success))",
  },
  interior: {
    percentage: 25,
    hours: 400,
    team: 8,
    color: "hsl(var(--warning))",
  },
  engineering: {
    percentage: 20,
    hours: 320,
    team: 6,
    color: "hsl(var(--primary))",
  },
  management: {
    percentage: 20,
    hours: 320,
    team: 4,
    color: "hsl(var(--secondary))",
  },
};

const data: ChartData<"doughnut"> = {
  labels: ["Arquitectura", "Diseño Interior", "Ingeniería", "Gestión de Proyectos"],
  datasets: [
    {
      data: Object.values(resourceData).map(r => r.percentage),
      backgroundColor: Object.values(resourceData).map(r => r.color),
      borderWidth: 1,
    },
  ],
};

export function ResourceUtilization() {
  return (
    <div className="space-y-6">
      <div className="h-[300px] flex items-center justify-center">
        <Doughnut
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {Object.entries(resourceData).map(([key, value]) => (
          <div key={key} className="space-y-1 p-4 rounded-lg" style={{ backgroundColor: `${value.color}15` }}>
            <div className="font-medium">
              {key === "architecture" && "Arquitectura"}
              {key === "interior" && "Diseño Interior"}
              {key === "engineering" && "Ingeniería"}
              {key === "management" && "Gestión"}
            </div>
            <div className="text-muted-foreground">
              <div>{value.percentage}% de utilización</div>
              <div>{value.hours} horas asignadas</div>
              <div>{value.team} miembros del equipo</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}