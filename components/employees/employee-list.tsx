"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Phone, Building2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEmployeesDb } from "@/lib/api/employees";
import { Employee } from "@/lib/types/employee";
import { useEffect, useState, useCallback } from "react";

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployeesDb();
      setEmployees(data);
    } catch (err: any) {
      console.error(err);
      setError("Error cargando empleados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();

    const handleEmployeeCreated = () => {
      fetchEmployees();
    };
    window.addEventListener("employeeCreated", handleEmployeeCreated);
    return () => window.removeEventListener("employeeCreated", handleEmployeeCreated);
  }, [fetchEmployees]);

  if (isLoading) {
    return <div className="text-center p-4">Cargando empleados...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-destructive">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empleado</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Proyectos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const initials = employee.name.split(" ").map((n) => n[0]).join("");
            return (
              <TableRow key={employee.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {employee.avatar && employee.avatar.startsWith("http") ? (
                        <AvatarImage src={employee.avatar} />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.projectIds.length}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={employee.status === "Activo" ? "default" : "secondary"}>
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Asignar Proyecto</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}