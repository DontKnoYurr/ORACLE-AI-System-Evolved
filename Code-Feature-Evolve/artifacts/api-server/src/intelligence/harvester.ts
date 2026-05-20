/**
 * ORACLE Proprietary Web Intelligence Harvester
 * 
 * Ingests live intelligence from public RSS feeds using Node.js fetch.
 * Processes raw news through the proprietary NLP pipeline — NO external AI.
 * Automatically injects classified signals into the ORACLE database.
 */

import { db } from "@workspace/db";
import { signalsTable, seismicEventsTable } from "@workspace/db/schema";
import { processRawIntelligence, extractEntities } from "./nlp.js";
import { generateSeismicWaveform, computeEmotionalValence } from "./field-math.js";
import { desc } from "drizzle-orm";

// Public RSS feeds — no API keys needed
const INTELLIGENCE_FEEDS = [
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews", category: "geopolitical" },
  { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "economic" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "geopolitical" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "geopolitical" },
  { name: "USGS Earthquakes", url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson", category: "seismic" },
  { name: "Financial Times", url: "https://www.ft.com/rss/home/world", category: "economic" },
];

export interface HarvestResult {
  feedsChecked: number;
  signalsIngested: number;
  seismicEventsDetected: number;
  errors: string[];
  sources: string[];
  timestamp: string;
}

interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
}

/**
 * Parse RSS XML — pure regex, no external parser.
 */
function parseRSS(xml: string, defaultCategory: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const description = extractTag(itemXml, "description") || extractTag(itemXml, "summary") || "";
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate") || extractTag(itemXml, "dc:date") || new Date().toISOString();
    if (title && title.length > 3) {
      items.push({ title, description: stripHtml(description), link, pubDate, category: defaultCategory });
    }
  }
  return items.slice(0, 15); // cap per feed
}

function extractTag(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i"),
    new RegExp(`<${tag}\\s[^/]*/?>([^<]*)<\\/${tag}>`, "i"),
  ];
  for (const p of patterns) {
    const m = xml.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

/**
 * Parse USGS GeoJSON earthquake feed.
 */
function parseUSGSGeoJSON(json: string): Array<{ title: string; magnitude: number; place: string; time: number }> {
  try {
    const data = JSON.parse(json);
    return (data.features ?? []).slice(0, 10).map((f: any) => ({
      title: f.properties.title ?? `M${f.properties.mag} earthquake`,
      magnitude: f.properties.mag ?? 0,
      place: f.properties.place ?? "Unknown location",
      time: f.properties.time ?? Date.now(),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch a single feed with timeout.
 */
async function fetchFeed(url: string, timeoutMs: number = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ORACLE-Intelligence-Harvester/1.0" },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

/**
 * Dedup: check if we've already ingested a signal with this title (approximate).
 */
async function isDuplicate(title: string): Promise<boolean> {
  const recent = await db.select({ title: signalsTable.title })
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(100);
  const normalizedTitle = title.toLowerCase().slice(0, 40);
  return recent.some(r => r.title.toLowerCase().slice(0, 40) === normalizedTitle);
}

let lastHarvestAt: string | null = null;
let totalHarvested = 0;
let harvestErrors: string[] = [];

/**
 * Main harvest function — runs across all feeds, processes with NLP, injects into DB.
 */
export async function runHarvest(): Promise<HarvestResult> {
  const result: HarvestResult = {
    feedsChecked: 0,
    signalsIngested: 0,
    seismicEventsDetected: 0,
    errors: [],
    sources: [],
    timestamp: new Date().toISOString(),
  };

  const fetchPromises = INTELLIGENCE_FEEDS.map(async (feed) => {
    const raw = await fetchFeed(feed.url);
    return { feed, raw };
  });

  const fetched = await Promise.all(fetchPromises);

  for (const { feed, raw } of fetched) {
    result.feedsChecked++;
    if (!raw) {
      result.errors.push(`${feed.name}: fetch failed`);
      continue;
    }

    // USGS Seismic feed
    if (feed.category === "seismic") {
      const earthquakes = parseUSGSGeoJSON(raw);
      for (const eq of earthquakes) {
        try {
          // Convert earthquake to seismic event
          const resonanceType = eq.magnitude >= 6.0 ? "danger" : eq.magnitude >= 4.0 ? "territorial" : "communication";
          const frequency = 0.1 + (eq.magnitude / 20); // scale Hz
          const amplitude = Math.min(1, eq.magnitude / 9);
          const waveform = generateSeismicWaveform(frequency, amplitude, 0.3 + Math.random() * 0.4, 0, 64);
          const valence = computeEmotionalValence(frequency, amplitude, resonanceType);

          await db.insert(seismicEventsTable).values({
            resonanceType,
            frequency,
            amplitude,
            duration: 30 + eq.magnitude * 10,
            source: eq.place ?? "Unknown",
            waveformData: waveform,
            emotionalValence: valence,
            propagationRadius: eq.magnitude * 800,
          }).onConflictDoNothing();

          result.seismicEventsDetected++;
        } catch {}
      }

      // Also ingest as signal
      for (const eq of earthquakes.slice(0, 3)) {
        if (eq.magnitude >= 4.5) {
          const title = eq.title;
          if (await isDuplicate(title)) continue;
          const priority = eq.magnitude >= 7 ? "critical" : eq.magnitude >= 6 ? "high" : "medium";
          try {
            await db.insert(signalsTable).values({
              title: title.slice(0, 120),
              content: `Seismic event detected: ${eq.place}. Magnitude ${eq.magnitude}. ORACLE seismic intelligence layer is analyzing infrasonic propagation patterns from this event.`,
              category: "seismic",
              priority,
              source: "USGS Earthquake Hazards Program",
              tags: ["seismic", "earthquake", "geophysical", eq.place.split(",")[0]?.toLowerCase().replace(/\s/g, "-") ?? "unknown"],
            });
            result.signalsIngested++;
          } catch {}
        }
      }

      result.sources.push(feed.name);
      continue;
    }

    // Standard RSS feeds
    const items = parseRSS(raw, feed.category);
    result.sources.push(feed.name);

    for (const item of items) {
      if (await isDuplicate(item.title)) continue;

      const processed = processRawIntelligence(item.title, item.description, item.link);

      try {
        await db.insert(signalsTable).values({
          title: processed.title,
          content: processed.content || item.title,
          category: processed.category,
          priority: processed.priority,
          source: processed.source,
          tags: processed.tags,
        });
        result.signalsIngested++;
      } catch {}
    }
  }

  lastHarvestAt = result.timestamp;
  totalHarvested += result.signalsIngested;
  harvestErrors = result.errors;

  return result;
}

/**
 * Get harvester status (for the intelligence status endpoint).
 */
export function getHarvesterStatus() {
  return {
    lastHarvestAt,
    totalHarvested,
    activeFeeds: INTELLIGENCE_FEEDS.map(f => ({ name: f.name, category: f.category })),
    errors: harvestErrors,
    nextHarvestIn: "automatic — runs every 10 minutes",
  };
}

// ─── Autonomous background harvest loop ───
let harvestLoopStarted = false;
export function startHarvestLoop() {
  if (harvestLoopStarted) return;
  harvestLoopStarted = true;

  // First harvest after 30s (let DB settle)
  setTimeout(async () => {
    try { await runHarvest(); } catch {}
  }, 30000);

  // Then every 10 minutes
  setInterval(async () => {
    try { await runHarvest(); } catch {}
  }, 10 * 60 * 1000);
}
