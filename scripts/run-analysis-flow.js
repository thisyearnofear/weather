import fs from "fs";
import path from "path";
import { analyzeWeatherImpactServer } from "../services/aiService.server.js";

function loadEnvKey() {
  const candidates = [".env.local", ".env", ".env.development.local"];
  for (const file of candidates) {
    try {
      const p = path.resolve(process.cwd(), file);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed
              .slice(eq + 1)
              .trim()
              .replace(/^"|"$/g, "");
            if (key === "VENICE_API_KEY" && val) return val;
          }
        }
      }
    } catch (e) {
      console.warn('Failed reading env file:', e?.message || e)
    }
  }
  return null;
}

async function main() {
  if (!process.env.VENICE_API_KEY) {
    const key = loadEnvKey();
    if (key) process.env.VENICE_API_KEY = key;
  }
  if (!process.env.VENICE_API_KEY) {
    console.error("VENICE_API_KEY missing");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_WEATHER_API_KEY) {
    const candidates = [".env.local", ".env", ".env.development.local"];
    for (const file of candidates) {
      try {
        const p = path.resolve(process.cwd(), file);
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf8");
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq > 0) {
              const k = trimmed.slice(0, eq).trim();
              const v = trimmed
                .slice(eq + 1)
                .trim()
                .replace(/^"|"$/g, "");
              if (k === "NEXT_PUBLIC_WEATHER_API_KEY" && v) {
                process.env.NEXT_PUBLIC_WEATHER_API_KEY = v;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed reading weather API key:', e?.message || e)
      }
    }
  }

  const params = {
    eventType: "Soccer",
    location: "Manchester, England",
    weatherData: null,
    currentOdds: { yes: 0.53, no: 0.47 },
    participants: ["Manchester United"],
    marketId: 123456,
    eventDate: "2025-11-24",
    title: "Will Manchester United win on 2025-11-24?",
    mode: "deep",
  };

  const result = await analyzeWeatherImpactServer(params);
  console.log("--- Analysis Flow Result ---");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
