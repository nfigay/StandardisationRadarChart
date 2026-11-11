// SSR tabular CSV v0: validate the export shape before touching the live graph.
const REQUIRED = ['id', 'label', 'ring', 'quadrant', 'working_group'];
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor', 'source', 'target', 'parent']);
const NUMBER_FIELDS = new Set(['x', 'y', 'radius']);
const MAX_ROWS = 10000;
const MAX_FIELDS = 150;

export function prepareCSVSSRImport(parsed, existing = []) {
  if (!parsed || !Array.isArray(parsed.data) || !Array.isArray(parsed.meta?.fields))
    throw new Error('CSV SSR invalide : en-têtes absents.');
  if (parsed.errors?.length) throw new Error(`Erreur CSV ligne ${parsed.errors[0].row + 2}: ${parsed.errors[0].message}`);
  const fields = parsed.meta.fields.map(s => String(s).replace(/^\uFEFF/, ''));
  if (!fields.length || fields.length > MAX_FIELDS || new Set(fields).size !== fields.length)
    throw new Error('CSV SSR : en-têtes vides, dupliqués ou trop nombreux.');
  if (fields.some(s => !s.trim() || FORBIDDEN.has(s))) throw new Error('CSV SSR : colonne réservée ou vide.');
  for (const required of REQUIRED) if (!fields.includes(required)) throw new Error(`Colonne CSV manquante : ${required}`);
  if (!parsed.data.length || parsed.data.length > MAX_ROWS) throw new Error('CSV SSR : nombre de lignes invalide.');

  const current = new Map(existing.map(n => [String(n.id), n]));
  const seen = new Set();
  const additions = [], updates = [], unchanged = [];
  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const id = String(row.id ?? '').trim();
    if (!id || seen.has(id)) throw new Error(`Ligne ${i + 2} : identifiant vide ou dupliqué (${id}).`);
    seen.add(id);
    for (const key of REQUIRED.slice(1)) if (!String(row[key] ?? '').trim())
      throw new Error(`Ligne ${i + 2} : ${key} vide.`);
    const data = Object.create(null);
    for (const key of fields) {
      const raw = row[key] == null ? '' : String(row[key]);
      // An empty CSV cell is not interpreted as deletion of an existing attribute.
      if (raw === '') continue;
      if (NUMBER_FIELDS.has(key)) {
        const n = Number(raw);
        if (!Number.isFinite(n)) throw new Error(`Ligne ${i + 2} : ${key} non numérique.`);
        data[key] = n;
      } else {
        data[key] = raw;
      }
    }
    data.id = id;
    const previous = current.get(id);
    if (!previous) additions.push({ id, data });
    else {
      const changed = Object.keys(data).some(key => String(previous[key] ?? '') !== String(data[key]));
      (changed ? updates : unchanged).push({ id, data });
    }
  }
  return { additions, updates, unchanged, total: parsed.data.length, fields };
}

// Called only inside an explicit W2UI confirmation callback. No node or edge deletion.
export function applyCSVSSRImport(plan, graph) {
  if (!plan || !graph || typeof graph.getElementById !== 'function') throw new Error('Graphe non disponible.');
  const created = [], originals = [];
  try {
    graph.batch(() => {
      for (const item of plan.updates) {
        const node = graph.getElementById(item.id);
        if (!node.length || !node.isNode()) throw new Error(`Nœud introuvable : ${item.id}`);
        originals.push({ node, data: { ...node.data() }, addedKeys: Object.keys(item.data).filter(k => !Object.hasOwn(node.data(), k)) });
        // Preserve existing attributes, edges, Cytoscape position and identity.
        node.data({ ...node.data(), ...item.data });
      }
      for (const item of plan.additions) {
        if (graph.getElementById(item.id).length) throw new Error(`Identifiant déjà utilisé : ${item.id}`);
        created.push(graph.add({ group: 'nodes', data: { ...item.data }, position: { x: item.data.x, y: item.data.y } }));
      }
    });
  } catch (error) {
    graph.batch(() => {
      for (const newNode of created.reverse()) newNode.remove();
      for (const old of originals.reverse()) { if (old.addedKeys.length) old.node.removeData(old.addedKeys.join(' ')); old.node.data(old.data); }
    });
    throw error;
  }
  return { added: created.length, updated: originals.length, unchanged: plan.unchanged.length };
}
