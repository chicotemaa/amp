import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const legendItems = [
  {
    type: "Inicio de Obra",
    color: "bg-success",
    description: "Comienzo de nuevos proyectos"
  },
  {
    type: "Revisión",
    color: "bg-warning",
    description: "Inspecciones y evaluaciones"
  },
  {
    type: "Hito",
    color: "bg-primary",
    description: "Logros y puntos clave"
  },
  {
    type: "Finalización",
    color: "bg-destructive",
    description: "Término de proyectos"
  }
];

export function CalendarLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leyenda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <div>
                <p className="font-medium">{item.type}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}