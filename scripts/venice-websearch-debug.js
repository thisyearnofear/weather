import OpenAI from "openai";
import fs from "fs";
import path from "path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

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
  const apiKey = process.env.VENICE_API_KEY || loadEnvKey();
  if (!apiKey) {
    console.error("VENICE_API_KEY missing");
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  const title = args.title || "Will Manchester United win on 2025-11-24?";
  const eventType = args.eventType || "Soccer";
  const venue = args.venue || "Manchester, England";
  const eventDate = args.eventDate || "2025-11-24";
  const participants = (args.participants || "Manchester United")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const yes = args.oddsYes ? parseFloat(args.oddsYes) : 0.53;
  const no = args.oddsNo ? parseFloat(args.oddsNo) : 0.47;

  const participantText =
    participants && participants.length > 0
      ? ` (${participants.join(" vs ")})`
      : "";
  const oddsText = `YES: ${(yes * 100).toFixed(1)}%, NO: ${(no * 100).toFixed(
    1
  )}%`;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.venice.ai/api/v1",
  });

  const system = {
    role: "system",
    content: `You are an expert sports betting analyst specializing in weather impacts on game outcomes. Provide SPECIFIC, ACTIONABLE analysis with clear reasoning.

STRICT REQUIREMENTS:
- Tailor analysis to the given sport and participants only
- Do NOT reuse or reference any example content; generate event-specific analysis
- Output a single JSON object with the required fields only
- This is association football (soccer). Do not mention NFL teams, touchdowns, or American football terminology.`,
  };

  const user = {
    role: "user",
    content: `EVENT CONTEXT
- Event Title: ${title}
- Event Type: ${eventType}
- Participants: ${participantText || "Unknown"}
- Venue: ${venue}
- Scheduled Date: ${eventDate}

WEATHER
- Temperature: unknown°F
- Condition: unknown
- Precipitation chance: 0%
- Wind: 0 mph

MARKET ODDS: ${oddsText}

RESPONSE FORMAT (JSON only): {
  "weather_impact": "LOW|MEDIUM|HIGH",
  "odds_efficiency": "FAIR|OVERPRICED|UNDERPRICED|UNKNOWN",
  "confidence": "LOW|MEDIUM|HIGH",
  "analysis": "Event-specific reasoning only, no example content",
  "key_factors": ["specific, measurable factors"],
  "recommended_action": "Clear recommendation"
}`,
  };

  const res = await client.chat.completions.create({
    model: "qwen3-235b",
    messages: [system, user],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: "json_object" },
    venice_parameters: {
      enable_web_search: true,
      include_venice_system_prompt: true,
      strip_thinking_response: true,
      enable_web_citations: true,
      return_search_results_as_documents: true,
    },
  });

  const choice = res.choices?.[0]?.message?.content || "";
  console.log("--- Venice raw response ---");
  console.log(JSON.stringify(res, null, 2));
  console.log("--- Parsed content ---");
  console.log(choice);
  try {
    const parsed = JSON.parse(choice);
    console.log("--- Parsed JSON ---");
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log("Failed to parse content as JSON:", e.message);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
