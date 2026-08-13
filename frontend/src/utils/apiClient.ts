const BASE = "http://127.0.0.1:8000/api";

type Json = Record<string, unknown> | unknown[] | null;

function transform(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(transform);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "id") {
        out[k] = v == null ? v : String(v);
      } else if (k.endsWith("Ids") && Array.isArray(v)) {
        out[k] = v.map((x) => (x == null ? x : String(x)));
      } else if (k.endsWith("Id")) {
        out[k] = v == null ? "" : String(v);
      } else {
        out[k] = transform(v);
      }
    }
    return out;
  }
  return value;
}

function formatApiError(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(formatApiError).join("; ");
  if (data && typeof data === "object") {
    if ("detail" in data && typeof (data as any).detail === "string") {
      return (data as any).detail;
    }
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${formatApiError(value)}`)
      .join("; ");
  }
  return String(data);
}

async function handle(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message = formatApiError(data);
    throw new Error(message);
  }
  return transform(data);
}

export const api = {
  get: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
    return handle(res) as Promise<T>;
  },
  post: async <T = unknown>(path: string, body?: Json): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handle(res) as Promise<T>;
  },
  put: async <T = unknown>(path: string, body?: Json): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handle(res) as Promise<T>;
  },
  patch: async <T = unknown>(path: string, body?: Json): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handle(res) as Promise<T>;
  },
  postForm: async <T = unknown>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    });
    return handle(res) as Promise<T>;
  },
  putForm: async <T = unknown>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { Accept: "application/json" },
      body: form,
    });
    return handle(res) as Promise<T>;
  },
  patchForm: async <T = unknown>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { Accept: "application/json" },
      body: form,
    });
    return handle(res) as Promise<T>;
  },
  del: async (path: string): Promise<void> => {
    const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
    await handle(res);
  },
};
