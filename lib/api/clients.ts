import { CLIENTS } from "@/lib/data/clients";
import { Client } from "@/lib/types/client";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { getCachedQuery } from "@/lib/api/query-cache";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientProjectRow = Database["public"]["Tables"]["client_projects"]["Row"];

function mapClientRow(row: ClientRow, projectIds: number[]): Client {
    return {
        id: row.id,
        name: row.name,
        company: row.company,
        email: row.email,
        phone: row.phone ?? "",
        projectIds,
        lastInteraction: row.last_interaction ?? new Date().toISOString().slice(0, 10),
        status: row.status as Client["status"],
        notificationPrefs: (row.notification_prefs ?? []) as Client["notificationPrefs"],
        avatar: row.avatar ?? "",
    };
}

export async function getClientsDb(): Promise<Client[]> {
    return getCachedQuery("clients:list", async () => {
        const [{ data: clientsData, error: clientsError }, { data: linksData, error: linksError }] = await Promise.all([
            supabase.from("clients").select("*"),
            supabase.from("client_projects").select("*"),
        ]);

        if (clientsError || linksError) {
            console.error("Supabase clients error:", clientsError?.message ?? linksError?.message);
            return [];
        }

        const links = linksData as ClientProjectRow[];
        const linksByClient = links.reduce<Record<number, number[]>>((acc, link) => {
            if (!acc[link.client_id]) acc[link.client_id] = [];
            acc[link.client_id].push(link.project_id);
            return acc;
        }, {});

        return (clientsData as ClientRow[]).map((row) => mapClientRow(row, linksByClient[row.id] ?? []));
    });
}

export async function getClientByIdDb(id: number): Promise<Client | null> {
    return getCachedQuery(`clients:${id}`, async () => {
        const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
        if (error) {
            console.error("Supabase client error:", error.message);
            return null;
        }
        return mapClientRow(data as ClientRow, []);
    });
}

export async function getClientStatsDb() {
    const clients = await getClientsDb();
    const total = clients.length;
    const active = clients.filter((client) => client.status === "Activo").length;
    const potential = clients.filter((client) => client.status === "Potencial").length;
    const totalProjects = clients.reduce((sum, client) => sum + client.projectIds.length, 0);

    return { total, active, potential, totalProjects };
}

export function getClients(): Client[] {
    return CLIENTS;
}

export function getClientById(id: number): Client | undefined {
    return CLIENTS.find((c) => c.id === id);
}

export function getRecentClients(limit = 3): Client[] {
    return [...CLIENTS]
        .sort(
            (a, b) =>
                new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
        )
        .slice(0, limit);
}

export function getClientStats() {
    const total = CLIENTS.length;
    const active = CLIENTS.filter((c) => c.status === "Activo").length;
    const potential = CLIENTS.filter((c) => c.status === "Potencial").length;
    const totalProjects = CLIENTS.reduce((sum, c) => sum + c.projectIds.length, 0);

    return { total, active, potential, totalProjects };
}

// --- SUPABASE MUTATIONS ---

export type CreateClientInput = Omit<Client, "id" | "projectIds" | "lastInteraction">;

export async function createClient(input: CreateClientInput): Promise<Client> {
    const newId = Date.now(); // Fallback ID for non-auto-incrementing PK
    const { data, error } = await supabase
        .from("clients")
        .insert({
            id: newId,
            name: input.name,
            company: input.company,
            email: input.email,
            phone: input.phone,
            status: input.status,
            notification_prefs: input.notificationPrefs,
            avatar: input.avatar || null,
            last_interaction: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating client:", error.message);
        throw new Error("No se pudo crear el cliente.");
    }

    return mapClientRow(data as ClientRow, []);
}

export async function updateClient(id: number, input: Partial<Client>): Promise<Client> {
    const updates: Record<string, any> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.company !== undefined) updates.company = input.company;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.status !== undefined) updates.status = input.status;
    if (input.notificationPrefs !== undefined) updates.notification_prefs = input.notificationPrefs;
    if (input.lastInteraction !== undefined) updates.last_interaction = input.lastInteraction;
    if (input.avatar !== undefined) updates.avatar = input.avatar;

    const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating client:", error.message);
        throw new Error("No se pudo actualizar el cliente.");
    }

    // Best effort mapping, missing projects in return but usually not an issue for UI update
    return mapClientRow(data as ClientRow, []);
}

export async function deleteClient(id: number): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
        console.error("Error deleting client:", error.message);
        throw new Error("No se pudo eliminar el cliente.");
    }
}
