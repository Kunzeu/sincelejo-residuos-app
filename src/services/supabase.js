import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function applyHeaders(xhr, headers) {
  if (!headers) return;
  const entries = headers instanceof Headers
    ? Array.from(headers.entries())
    : Array.isArray(headers)
      ? headers
      : Object.entries(headers);

  entries.forEach(([key, value]) => {
    if (value != null) xhr.setRequestHeader(key, String(value));
  });
}

function parseHeaders(raw) {
  const map = {};
  raw.trim().split(/[\r\n]+/).forEach((line) => {
    const index = line.indexOf(':');
    if (index > 0) map[line.slice(0, index)] = line.slice(index + 1).trim();
  });
  return {
    get(name) {
      const key = Object.keys(map).find((item) => item.toLowerCase() === String(name).toLowerCase());
      return key ? map[key] : null;
    },
  };
}

// Expo reemplaza fetch por un módulo nativo que aquí falla con
// "fetch failed: UnexpectedException". XMLHttpRequest usa la red de React Native.
function supabaseFetch(input, init = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return Promise.reject(new Error('Faltan las variables de Supabase en el archivo .env. Reinicia la app después de guardarlas.'));
  }

  const url = typeof input === 'string' ? input : input.url;
  const method = init.method || (typeof input === 'string' ? 'GET' : input.method) || 'GET';
  const headers = init.headers || (typeof input === 'string' ? undefined : input.headers);
  const body = init.body ?? null;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    applyHeaders(xhr, headers);
    xhr.onload = () => {
      const text = xhr.responseText || '';
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
        json: async () => (text ? JSON.parse(text) : null),
        text: async () => text,
      });
    };
    xhr.onerror = () => reject(new TypeError('No se pudo conectar con Supabase. Revisa tu conexión a internet.'));
    xhr.send(body);
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  {
    global: { fetch: supabaseFetch },
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
