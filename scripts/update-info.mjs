#!/usr/bin/env node

/**
 * Update the Valdoria info data file with the latest weather and events.
 *
 * - Weather: Open-Meteo (no API key required).
 * - Events: RSS feeds configurable via INFO_EVENT_FEEDS (comma separated).
 *
 * Usage:
 *   node scripts/update-info.mjs
 *
 * Optional environment variables:
 *   INFO_EVENT_FEEDS="https://feed1.example/rss,https://feed2.com/rss"
 *   INFO_EVENT_KEYWORDS="Tarancón,Cañete"
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const outputFile = path.join(dataDir, 'info.json');

const TARANCON_COORDINATES = { latitude: 40.0099, longitude: -3.007 };
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${TARANCON_COORDINATES.latitude}&longitude=${TARANCON_COORDINATES.longitude}&current=temperature_2m,weather_code&timezone=Europe%2FMadrid`;

const DEFAULT_EVENT_FEEDS = [
  'https://www.turismocastillalamancha.es/rss/eventos/'
];

const EVENT_FEEDS = (process.env.INFO_EVENT_FEEDS || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const EVENT_KEYWORDS = (process.env.INFO_EVENT_KEYWORDS || 'Tarancón,Tarancon,Cuenca,Uclés,Ucles,Segóbriga,Segobriga')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const WEATHER_CODE_MAP = {
  0: { icon: '☀️', es: 'Cielo despejado', en: 'Clear sky' },
  1: { icon: '🌤️', es: 'Casi despejado', en: 'Mostly clear' },
  2: { icon: '⛅️', es: 'Parcialmente nublado', en: 'Partly cloudy' },
  3: { icon: '☁️', es: 'Cubierto', en: 'Overcast' },
  45: { icon: '🌫️', es: 'Niebla', en: 'Fog' },
  48: { icon: '🌫️', es: 'Niebla con escarcha', en: 'Freezing fog' },
  51: { icon: '🌦️', es: 'Llovizna ligera', en: 'Light drizzle' },
  53: { icon: '🌦️', es: 'Llovizna moderada', en: 'Moderate drizzle' },
  55: { icon: '🌧️', es: 'Llovizna intensa', en: 'Dense drizzle' },
  56: { icon: '🌧️', es: 'Llovizna helada ligera', en: 'Light freezing drizzle' },
  57: { icon: '🌧️', es: 'Llovizna helada intensa', en: 'Heavy freezing drizzle' },
  61: { icon: '🌧️', es: 'Lluvia ligera', en: 'Light rain' },
  63: { icon: '🌧️', es: 'Lluvia moderada', en: 'Moderate rain' },
  65: { icon: '🌧️', es: 'Lluvia intensa', en: 'Heavy rain' },
  66: { icon: '🌧️', es: 'Lluvia helada ligera', en: 'Light freezing rain' },
  67: { icon: '🌧️', es: 'Lluvia helada intensa', en: 'Heavy freezing rain' },
  71: { icon: '❄️', es: 'Nieve ligera', en: 'Light snow' },
  73: { icon: '❄️', es: 'Nieve moderada', en: 'Moderate snow' },
  75: { icon: '❄️', es: 'Nieve intensa', en: 'Heavy snow' },
  77: { icon: '❄️', es: 'Granizo fino', en: 'Snow grains' },
  80: { icon: '🌦️', es: 'Chubascos ligeros', en: 'Light showers' },
  81: { icon: '🌧️', es: 'Chubascos moderados', en: 'Moderate showers' },
  82: { icon: '🌧️', es: 'Chubascos intensos', en: 'Heavy showers' },
  85: { icon: '❄️', es: 'Chubascos de nieve', en: 'Snow showers' },
  86: { icon: '❄️', es: 'Chubascos fuertes de nieve', en: 'Heavy snow showers' },
  95: { icon: '⛈️', es: 'Tormenta', en: 'Thunderstorm' },
  96: { icon: '⛈️', es: 'Tormenta con granizo ligero', en: 'Thunderstorm with light hail' },
  99: { icon: '⛈️', es: 'Tormenta con granizo intenso', en: 'Thunderstorm with heavy hail' }
};

const fetchJson = async (url, label) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'Valdoria-Info-Updater' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (${response.status})`);
  }
  return response.json();
};

const fetchText = async (url, label) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'Valdoria-Info-Updater' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (${response.status})`);
  }
  return response.text();
};

const normaliseWeather = (data) => {
  const weatherCode = Number(data?.current?.weather_code);
  const temperatureC = typeof data?.current?.temperature_2m === 'number' ? Math.round(data.current.temperature_2m) : null;
  const descriptor = WEATHER_CODE_MAP[weatherCode] || WEATHER_CODE_MAP[0];

  return {
    updated_at: new Date().toISOString(),
    temperature_c: temperatureC,
    description_es: descriptor.es,
    description_en: descriptor.en,
    icon: descriptor.icon
  };
};

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const parseRss = (xml, feedUrl) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const pull = (tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const res = block.match(regex);
      return res ? stripHtml(res[1]) : '';
    };

    const title = pull('title');
    const link = pull('link');
    const description = pull('description');
    const pubDate = pull('pubDate') || pull('dc:date') || pull('date');

    if (!title) {
      continue;
    }

    items.push({
      title,
      link,
      description,
      pubDate,
      feed: feedUrl
    });
  }

  return items;
};

const matchesKeywords = (text) => {
  if (!EVENT_KEYWORDS.length) {
    return true;
  }
  const normalised = (text || '').toLowerCase();
  return EVENT_KEYWORDS.some((keyword) => normalised.includes(keyword.toLowerCase()));
};

const normaliseEvent = (item) => {
  const now = new Date();
  let eventDate = null;

  if (item.pubDate) {
    const parsed = new Date(item.pubDate);
    if (!Number.isNaN(parsed.valueOf())) {
      eventDate = parsed.toISOString();
    }
  }

  const summary = item.description || '';
  const locationMatch = summary.match(/(Tarancón|Cuenca|Ucl[eé]s|Seg[óo]briga)/i);
  const location = locationMatch ? locationMatch[0] : 'Tarancón y comarca';

  return {
    date: eventDate || now.toISOString(),
    title_es: item.title,
    title_en: item.title,
    summary_es: summary,
    summary_en: summary,
    location,
    url: item.link || item.feed
  };
};

const collectEvents = async () => {
  const feeds = EVENT_FEEDS.length ? EVENT_FEEDS : DEFAULT_EVENT_FEEDS;
  const fetches = feeds.map(async (url) => {
    try {
      const xml = await fetchText(url, `event feed ${url}`);
      return parseRss(xml, url);
    } catch (error) {
      console.warn(`[Info] Unable to fetch events from ${url}: ${error.message}`);
      return [];
    }
  });

  const results = await Promise.all(fetches);
  const flattened = results.flat();

  const filtered = flattened.filter((item) =>
    matchesKeywords(`${item.title} ${item.description}`)
  );

  const deduplicatedMap = new Map();
  filtered.forEach((item) => {
    const key = item.link || item.title;
    if (!deduplicatedMap.has(key)) {
      deduplicatedMap.set(key, item);
    }
  });

  const normalised = Array.from(deduplicatedMap.values()).map(normaliseEvent);

  normalised.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    updated_at: new Date().toISOString(),
    items: normalised.slice(0, 8)
  };
};

const ensureDataDirectory = async () => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('[Info] Unable to ensure data directory', error);
    throw error;
  }
};

const writeDataFile = async (payload) => {
  await ensureDataDirectory();
  const json = JSON.stringify(payload, null, 2);
  await fs.writeFile(outputFile, `${json}\n`, 'utf8');
  console.log(`[Info] Data file updated at ${outputFile}`);
};

const run = async () => {
  console.log('[Info] Updating daily information feed…');

  let weather = null;
  try {
    const weatherResponse = await fetchJson(WEATHER_URL, 'weather');
    weather = normaliseWeather(weatherResponse);
  } catch (error) {
    console.warn(`[Info] Unable to refresh weather data: ${error.message}`);
  }

  let events = null;
  try {
    events = await collectEvents();
  } catch (error) {
    console.warn(`[Info] Unable to refresh events: ${error.message}`);
  }

  const output = {
    updated_at: new Date().toISOString(),
    weather: weather ?? {
      updated_at: null,
      temperature_c: null,
      description_es: 'Información meteorológica no disponible.',
      description_en: 'Weather information not available.',
      icon: 'ℹ️'
    },
    events: events ?? {
      updated_at: null,
      items: []
    }
  };

  await writeDataFile(output);
};

run().catch((error) => {
  console.error('[Info] Unexpected error while updating data:', error);
  process.exitCode = 1;
});

