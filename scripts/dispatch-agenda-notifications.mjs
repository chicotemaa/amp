import fs from "node:fs";
import path from "node:path";

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const cwd = process.cwd();
loadDotEnvFile(path.join(cwd, ".env.local"));

const baseUrl = process.env.APP_URL || "http://localhost:3000";
const secret =
  process.env.AGENDA_NOTIFICATION_DISPATCH_SECRET || process.env.CRON_SECRET || "";

if (!secret) {
  console.error(
    "Missing dispatch secret. Set AGENDA_NOTIFICATION_DISPATCH_SECRET or CRON_SECRET."
  );
  process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/agenda-notifications/dispatch`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
});

const bodyText = await response.text();
process.stdout.write(`${bodyText}\n`);

if (!response.ok) {
  process.exit(1);
}
