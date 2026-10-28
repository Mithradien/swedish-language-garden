import { useCallback, useEffect, useRef, useState } from "react";

export const SETTINGS_KEY = "bokningar.settings.v1";

export type Settings = {
  logo: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  swish: string;
  vatNr: string;
  bic: string;
  iban: string;
  bankgiro: string;
  signal: string;
};

export const DEFAULT_SETTINGS: Settings = {
  logo: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  postalCode: "",
  city: "",
  swish: "",
  vatNr: "",
  bic: "",
  iban: "",
  bankgiro: "",
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

function readStored(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Läser inställningar ur den här webbläsaren. Varje ändring sparas direkt, så
 * logotyp, färger och företagsuppgifter finns kvar när sidan öppnas igen –
 * och följer med till andra fönster som har samma sida öppen.
 */
export function useSettings() {
  const [settings, setRaw] = useState<Settings>(DEFAULT_SETTINGS);
  const saved = useRef("");

  useEffect(() => {
    const next = readStored();
    saved.current = JSON.stringify(next);
    setRaw(next);
    const sync = () => {
      const fresh = readStored();
      const json = JSON.stringify(fresh);
      if (json === saved.current) return;
      saved.current = json;
      setRaw(fresh);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("settings-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("settings-changed", sync);
    };
  }, []);

  const setSettings = useCallback((update: (prev: Settings) => Settings) => {
    setRaw((prev) => {
      const next = update(prev);
      const json = JSON.stringify(next);
      if (json !== saved.current) {
        saved.current = json;
        try {
          localStorage.setItem(SETTINGS_KEY, json);
        } catch {
          // för stor logotyp: visas ändå tills sidan stängs
        }
        window.dispatchEvent(new Event("settings-changed"));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applySignal(settings.signal);
  }, [settings.signal]);

  return { settings, setSettings };
}
