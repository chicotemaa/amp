"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { date: "2024-01", usage: 400 },
  { date: "2024-02", usage: 300 },
  { date: "2024-03", usage: 500 },
  { date: "2024-04", usage: 450 },
  { date: "2024-05", usage: 470 },
  { date: "2024-06", usage: 480 },
];

export function ResourceUsage() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">
            Uso de Recursos por Proyecto
          </h3>
          <p className="text-sm text-muted-foreground">
            Distribución mensual de horas por proyecto
          </p>
        </div>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Horas
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="usage"
                className="stroke-primary"
                // Asegurar clave única
                key={`line-${Math.random()}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}