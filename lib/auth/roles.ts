export type AppRole = "operator" | "pm" | "inspector" | "client";

export function canAccessBudget(role: AppRole | null) {
  return role === "operator" || role === "pm";
}

export function canAccessFinancials(role: AppRole | null) {
  return role === "operator";
}

export function isFieldRole(role: AppRole | null) {
  return role === "inspector";
}

