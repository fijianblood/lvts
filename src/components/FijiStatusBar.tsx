import { useEffect, useState } from 'react';
import { MapPin, Clock, Thermometer } from 'lucide-react';

const LAT = -18.1416;
const LON = 178.4419;
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Pacific%2FFiji`;

// Minimal WMO weather-code -> label/emoji map, enough for Fiji's tropical range.
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Foggy', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌦️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  80: { label: 'Rain showers', icon: '🌧️' },
  81: { label: 'Rain showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '🌧️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm', icon: '⛈️' },
};

interface Weather {
  tempC: number;
  label: string;
  icon: string;
}

function formatFijiNow() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Pacific/Fiji',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());
}

export default function FijiStatusBar() {
  const [now, setNow] = useState(formatFijiNow);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const tick = setInterval(() => setNow(formatFijiNow()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      try {
        const res = await fetch(WEATHER_URL);
        if (!res.ok) throw new Error('weather fetch failed');
        const data = await res.json();
        const code: number = data?.current?.weather_code;
        const tempC: number = data?.current?.temperature_2m;
        if (cancelled || typeof tempC !== 'number') return;
        const meta = WEATHER_CODES[code] ?? { label: 'Fair weather', icon: '🌤️' };
        setWeather({ tempC, label: meta.label, icon: meta.icon });
      } catch {
        // best-effort — the clock/date still render without weather
      }
    }
    loadWeather();
    const refresh = setInterval(loadWeather, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(refresh); };
  }, []);

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      gap: '0.6rem 1.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#334155',
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999,
      padding: '0.55rem 1.2rem', margin: '0 auto 1rem', maxWidth: 720,
      fontFamily: "'Space Grotesk',sans-serif",
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={14} color="#2563eb" /> {now} (Fiji time)
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <MapPin size={14} color="#7c3aed" /> Raiwai, Suva, Fiji
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {weather ? (
          <>
            <Thermometer size={14} color="#d97706" /> {weather.icon} {weather.label}, {Math.round(weather.tempC)}°C
          </>
        ) : (
          <>
            <Thermometer size={14} color="#d97706" /> Loading weather…
          </>
        )}
      </span>
    </div>
  );
}
