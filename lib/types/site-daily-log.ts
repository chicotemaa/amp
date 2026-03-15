export type SiteWeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "storm"
  | "wind"
  | "heat"
  | "cold"
  | "other";

export type SiteWeatherImpact = "none" | "minor" | "moderate" | "severe";

export const SITE_WEATHER_CONDITION_LABELS: Record<SiteWeatherCondition, string> = {
  clear: "Despejado",
  cloudy: "Nublado",
  rain: "Lluvia",
  storm: "Tormenta",
  wind: "Viento",
  heat: "Calor extremo",
  cold: "Frío",
  other: "Otro",
};

export const SITE_WEATHER_IMPACT_LABELS: Record<SiteWeatherImpact, string> = {
  none: "Sin impacto",
  minor: "Menor",
  moderate: "Moderado",
  severe: "Severo",
};

export interface SiteDailyLog {
  id: string;
  projectId: number;
  phaseId: string | null;
  logDate: string;
  weatherCondition: SiteWeatherCondition;
  weatherImpact: SiteWeatherImpact;
  workforceCount: number;
  hoursWorked: number;
  hoursLost: number;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface SiteDailyLogSummary {
  totalLogs: number;
  weatherAffectedDays: number;
  totalHoursWorked: number;
  totalHoursLost: number;
  equivalentDelayDays: number;
}
