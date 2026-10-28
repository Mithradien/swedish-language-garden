import { useEffect, useRef, useState } from "react";

export const SETTINGS_KEY = "bokningar.settings.v1";

export type Settings = {
  logo: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  signal: string;
};

export const DEFAULT_SETTINGS: Settings = {
  logo: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  signal: "#f9cc21",
};

export const SIGNAL_PRESETS = [
  { name: "Gult", hex: "#f9cc21" },
  { name: "Orange", hex: "#e4572e" },
  { name: "Blå", hex: "#2e86ab" },
  { name: "Grön", hex: "#3f8f5f" },
];

/** Mörk eller ljus text beroende på den valda färgen. */
export function readableOn(hex: string) {
  const m = /^#?([\da-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "#1a1a1a";
  const n = parseInt(m[1] ?? "", 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.45 ? "#1a1a1a" : "#f7f6f2";
}

function applySignal(signal: string) {
  const root = document.documentElement;
  root.style.setProperty("--signal", signal);
  root.style.setProperty("--accent", signal);
  root.style.setProperty("--signal-foreground", readableOn(signal));
}

/**
 * Läser_inställningar från den här webbläsaren, sparar dem vid varje ändring
 * och håller färgen korrekt även i andra fönster som har samma sida öppen.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const first = useRef(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(s) as Partial<Settings>) });
    } catch { /* trasig sparad data ignoreras */ }
    const sync = () => {
      try {
        const s = localStorage.getItem(SETTINGS_KEY);
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(s) as Partial<Settings>) });
      } catch { /* ignoreras */ }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("settings-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("settings-changed", sync);
    };
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("settings-changed"));
    } catch { /* för stor logotyp ignoreras */ }
  }, [settings]);

  useEffect(() => {
    applySignal(settings.signal);
  }, [settings.signal]);

  return { settings, setSettings };
}
