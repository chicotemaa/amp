"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getRoleLabel, type AppRole } from "@/lib/auth/roles";
import { getClientsDb } from "@/lib/api/clients";
import { getEmployeesDb } from "@/lib/api/employees";
import { getProjectsDb } from "@/lib/api/projects";
import {
  createWebUserDb,
  getUsersProfilesDb,
  updateUserProfileDb,
  type UserProfile,
} from "@/lib/api/users";
import type { Client } from "@/lib/types/client";
import type { Employee } from "@/lib/types/employee";
import type { Project } from "@/lib/types/project";

const ROLE_OPTIONS: AppRole[] = ["operator", "pm", "inspector", "client"];

type UserFormState = {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  employeeId: string;
  clientId: string;
  isActive: boolean;
  projectIds: number[];
};

const EMPTY_FORM: UserFormState = {
  email: "",
  password: "",
  fullName: "",
  role: "client",
  employeeId: "none",
  clientId: "none",
  isActive: true,
  projectIds: [],
};

function buildFormFromUser(user: UserProfile): UserFormState {
  return {
    email: "",
    password: "",
    fullName: user.fullName ?? "",
    role: user.role,
    employeeId: user.employeeId ? String(user.employeeId) : "none",
    clientId: user.clientId ? String(user.clientId) : "none",
    isActive: user.isActive,
    projectIds: user.assignedProjectIds,
  };
}

function UserAccessDialog({
  mode,
  open,
  onOpenChange,
  form,
  setForm,
  employees,
  clients,
  projects,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
  employees: Employee[];
  clients: Client[];
  projects: Project[];
  onSubmit: () => void;
  submitting: boolean;
}) {
  const needsEmployee = form.role !== "client";
  const needsClient = form.role === "client";
  const needsProjects = form.role === "pm" || form.role === "inspector";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Alta de usuario web" : "Editar acceso y rol"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {mode === "create" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="usuario@estudio.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-password">Password inicial</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Minimo 6 caracteres"
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-full-name">Nombre</Label>
              <Input
                id="user-full-name"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    role: value as AppRole,
                    projectIds:
                      value === "pm" || value === "inspector" ? current.projectIds : [],
                    clientId: value === "client" ? current.clientId : "none",
                    employeeId: value === "client" ? "none" : current.employeeId,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{needsClient ? "Cliente vinculado" : "Empleado vinculado"}</Label>
              {needsClient ? (
                <Select
                  value={form.clientId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, clientId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={form.employeeId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, employeeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin empleado</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    isActive: value === "active",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsProjects ? (
            <div className="space-y-3 rounded-md border p-4">
              <div>
                <p className="text-sm font-medium">Obras asignadas</p>
                <p className="text-xs text-muted-foreground">
                  Estas asignaciones alimentan el acceso del PM/Inspector a sus proyectos.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {projects.map((project) => {
                  const checked = form.projectIds.includes(project.id);
                  return (
                    <label
                      key={project.id}
                      className="flex items-start gap-3 rounded-md border p-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          setForm((current) => ({
                            ...current,
                            projectIds:
                              nextChecked === true
                                ? [...current.projectIds, project.id]
                                : current.projectIds.filter((id) => id !== project.id),
                          }))
                        }
                      />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          #{project.id} · {project.status}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {needsEmployee && form.employeeId === "none" ? (
            <p className="text-xs text-amber-600">
              Este rol puede operar sin empleado vinculado, pero perderá trazabilidad de autoría en varios flujos.
            </p>
          ) : null}

          {needsClient && form.clientId === "none" ? (
            <p className="text-xs text-amber-600">
              Un cliente sin vínculo a `client_id` no podrá ver obras en el portal.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              submitting ||
              !form.fullName.trim() ||
              (mode === "create" && (!form.email.trim() || !form.password.trim()))
            }
          >
            {submitting
              ? mode === "create"
                ? "Creando..."
                : "Guardando..."
              : mode === "create"
                ? "Crear usuario"
                : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManagement() {
  const [rows, setRows] = useState<UserProfile[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersData, employeesData, clientsData, projectsData] = await Promise.all([
        getUsersProfilesDb(),
        getEmployeesDb(),
        getClientsDb(),
        getProjectsDb(),
      ]);

      setRows(usersData);
      setEmployees(employeesData);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.fullName ?? "",
        row.id,
        row.role,
        row.employeeId?.toString() ?? "",
        row.clientId?.toString() ?? "",
        row.assignedProjectIds.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, search]);

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );
  const governanceSummary = useMemo(() => {
    const activeUsers = rows.filter((row) => row.isActive).length;
    const inactiveUsers = rows.length - activeUsers;
    const pmOrInspectorWithoutProjects = rows.filter(
      (row) =>
        ["pm", "inspector"].includes(row.role) && row.assignedProjectIds.length === 0
    ).length;
    const internalWithoutEmployee = rows.filter(
      (row) => row.role !== "client" && row.employeeId === null
    ).length;
    const clientsWithoutLink = rows.filter(
      (row) => row.role === "client" && row.clientId === null
    ).length;

    return {
      activeUsers,
      inactiveUsers,
      pmOrInspectorWithoutProjects,
      internalWithoutEmployee,
      clientsWithoutLink,
    };
  }, [rows]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const created = await createWebUserDb({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        employeeId: form.employeeId === "none" ? null : Number(form.employeeId),
        clientId: form.clientId === "none" ? null : Number(form.clientId),
        isActive: form.isActive,
        projectIds: form.projectIds,
      });
      setRows((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      toast.success("Usuario web creado y configurado.");
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (row: UserProfile) => {
    setEditingRow(row);
    setForm(buildFormFromUser(row));
  };

  const handleSave = async () => {
    if (!editingRow) return;

    setSubmitting(true);
    try {
      const updated = await updateUserProfileDb(editingRow.id, {
        role: form.role,
        fullName: form.fullName.trim(),
        employeeId: form.employeeId === "none" ? null : Number(form.employeeId),
        clientId: form.clientId === "none" ? null : Number(form.clientId),
        isActive: form.isActive,
        projectIds: form.projectIds,
      });
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setEditingRow(null);
      toast.success("Acceso actualizado.");
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usuarios activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{governanceSummary.activeUsers}</p>
            <p className="text-xs text-muted-foreground">
              {governanceSummary.inactiveUsers} inactivo(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PM/Inspector sin obras</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {governanceSummary.pmOrInspectorWithoutProjects}
            </p>
            <p className="text-xs text-muted-foreground">
              No tienen acceso operativo asignado.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Internos sin empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {governanceSummary.internalWithoutEmployee}
            </p>
            <p className="text-xs text-muted-foreground">
              Pierden trazabilidad de autoría.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Clientes sin vínculo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{governanceSummary.clientsWithoutLink}</p>
            <p className="text-xs text-muted-foreground">
              No podrán operar el portal.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Obras cargadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{projects.length}</p>
            <p className="text-xs text-muted-foreground">
              Base disponible para asignaciones.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usuarios Web</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Alta, rol, vínculo y asignación operativa desde la web.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              El operador puede crear acceso real y dejar el usuario listo para trabajar sin SQL manual.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, id o rol..."
              className="w-full sm:w-[280px]"
            />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>Nuevo usuario</Button>
              </DialogTrigger>
              <UserAccessDialog
                mode="create"
                open={createOpen}
                onOpenChange={setCreateOpen}
                form={form}
                setForm={setForm}
                employees={employees}
                clients={clients}
                projects={projects}
                onSubmit={() => void handleCreate()}
                submitting={submitting}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Obras</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.fullName || "Sin nombre"}</div>
                      <div className="text-xs text-muted-foreground">{row.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRoleLabel(row.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "secondary" : "destructive"}>
                        {row.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.employeeId ? (
                        <Badge variant="outline">Empleado #{row.employeeId}</Badge>
                      ) : row.clientId ? (
                        <Badge variant="outline">Cliente #{row.clientId}</Badge>
                      ) : (
                        <Badge variant="secondary">Sin vínculo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.assignedProjectIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.assignedProjectIds.slice(0, 2).map((projectId) => (
                            <Badge key={projectId} variant="outline">
                              {projectNameById.get(projectId) ?? `Proyecto ${projectId}`}
                            </Badge>
                          ))}
                          {row.assignedProjectIds.length > 2 ? (
                            <Badge variant="secondary">
                              +{row.assignedProjectIds.length - 2}
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin asignación</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleEditOpen(row)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserAccessDialog
        mode="edit"
        open={editingRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null);
          }
        }}
        form={form}
        setForm={setForm}
        employees={employees}
        clients={clients}
        projects={projects}
        onSubmit={() => void handleSave()}
        submitting={submitting}
      />
    </div>
  );
}
