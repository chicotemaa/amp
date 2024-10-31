import { Metadata } from "next";
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeeStats } from "@/components/employees/employee-stats";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Empleados | ArchiPro",
  description: "Gestión de empleados y recursos humanos",
};

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground mt-2">
            Gestión del equipo y recursos humanos
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      <EmployeeStats />
      <EmployeeFilters />
      <EmployeeList />
    </div>
  );
}