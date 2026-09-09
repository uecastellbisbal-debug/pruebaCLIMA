const BASE = "/api";

async function req(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} en ${path}`);
  }
  return res.json();
}

export const api = {
  model: (name) => req(`/model/${name}`),
  surveyDefinition: () => req("/survey/definition"),
  kbManifest: () => req("/kb/manifest"),
  kbSheet: (file) => req(`/kb/sheet/${encodeURIComponent(file)}`),
  submitResponse: (payload) =>
    req("/responses", { method: "POST", body: JSON.stringify(payload) }),
  listResponses: () => req("/responses"),
  getResponse: (id) => req(`/responses/${id}`),
  aggregate: () => req("/responses/aggregate"),
};
