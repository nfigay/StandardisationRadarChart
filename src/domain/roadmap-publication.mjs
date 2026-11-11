/*
 * S14.3-A1 — Roadmap publication contract.
 *
 * Independent of Cytoscape, browser storage, network and ISO services.
 * Input must be an explicitly selected, approved graph snapshot.
 * This module does not decide whether a revision is publishable.
 */

export const ROADMAP_PACKAGE_FORMAT = 'standardisation-roadmap';
export const ROADMAP_PACKAGE_VERSION = 1;

const nodeFields = [
  'id', 'label', 'name', 'description', 'ring', 'quadrant',
  'working_group', 'hasBlip', 'Priority', 'Status Version',
  'Responsible', 'specialisation', 'type', 'standardId',
  'isoStandardId', 'standardIds'
];

const edgeFields = ['id', 'source', 'target', 'label', 'type'];

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function pick(object, fields) {
  const result = {};
  for (const key of fields) {
    if (Object.hasOwn(object, key)) {
      result[key] = plain(object[key]);
    }
  }
  return result;
}

function sanitizeGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes) ||
      !Array.isArray(graph.edges)) {
    throw new TypeError('graph must contain nodes and edges arrays');
  }

  const ids = new Set();

  const nodes = graph.nodes.map((entry, index) => {
    const data = entry?.data;
    if (!data || typeof data !== 'object') {
      throw new TypeError(`nodes[${index}].data is required`);
    }

    const id = requireString(data.id, `nodes[${index}].data.id`);
    if (ids.has(id)) throw new Error(`duplicate node: ${id}`);
    ids.add(id);

    const node = {data: pick(data, nodeFields)};

    if (entry.position) {
      const {x, y} = entry.position;
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new TypeError(`invalid position: ${id}`);
      }
      node.position = {x, y};
    }
    return node;
  });

  const edges = graph.edges.map((entry, index) => {
    const data = entry?.data;
    if (!data || typeof data !== 'object') {
      throw new TypeError(`edges[${index}].data is required`);
    }

    requireString(data.id, `edges[${index}].data.id`);
    const source = requireString(data.source, 'edge source');
    const target = requireString(data.target, 'edge target');

    if (!ids.has(source) || !ids.has(target)) {
      throw new Error(`edge references an external node: ${data.id}`);
    }
    return {data: pick(data, edgeFields)};
  });

  return {nodes, edges};
}

function referencedStandards(graph) {
  const ids = new Set();

  for (const node of graph.nodes) {
    const data = node.data;

    for (const field of ['standardId', 'isoStandardId']) {
      if (data[field] !== undefined && data[field] !== null) {
        ids.add(requireString(data[field], field));
      }
    }

    if (data.standardIds !== undefined) {
      if (!Array.isArray(data.standardIds)) {
        throw new TypeError('standardIds must be an array');
      }
      for (const id of data.standardIds) {
        ids.add(requireString(id, 'standardIds entry'));
      }
    }
  }
  return [...ids].sort();
}

export function createRoadmapPackage({
  roadmapId,
  title,
  revisionId,
  graph,
  standards = {},
  catalogRelease = null
}) {
  requireString(roadmapId, 'roadmapId');
  requireString(title, 'title');
  requireString(revisionId, 'revisionId');

  const snapshot = sanitizeGraph(graph);
  const ids = referencedStandards(snapshot);
  const selected = {};

  for (const id of ids) {
    if (!Object.hasOwn(standards, id)) {
      throw new Error(`missing ISO record required by roadmap: ${id}`);
    }

    const record = standards[id];
    if (!record || typeof record !== 'object' ||
        Array.isArray(record)) {
      throw new TypeError(`invalid ISO record: ${id}`);
    }

    // Snapshot only display fields, never the full catalogue record.
    selected[id] = pick(record, [
      'id', 'reference', 'title', 'status',
      'publicationDate', 'edition', 'committee', 'ics'
    ]);
  }

  const result = {
    format: ROADMAP_PACKAGE_FORMAT,
    version: ROADMAP_PACKAGE_VERSION,
    roadmap: {
      id: roadmapId,
      title,
      publishedRevisionId: revisionId
    },
    catalog: {
      release: catalogRelease,
      standards: selected
    },
    graph: snapshot
  };

  return validateRoadmapPackage(result);
}

export function validateRoadmapPackage(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('invalid roadmap package');
  }

  if (input.format !== ROADMAP_PACKAGE_FORMAT ||
      input.version !== ROADMAP_PACKAGE_VERSION) {
    throw new Error('unsupported roadmap package format or version');
  }

  const allowed = ['format', 'version', 'roadmap', 'catalog', 'graph'];
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) {
      throw new Error(`unexpected package section: ${key}`);
    }
  }

  requireString(input.roadmap?.id, 'roadmap.id');
  requireString(input.roadmap?.title, 'roadmap.title');
  requireString(
    input.roadmap?.publishedRevisionId,
    'roadmap.publishedRevisionId'
  );

  const graph = sanitizeGraph(input.graph);
  const required = referencedStandards(graph);
  const records = input.catalog?.standards;

  if (!records || typeof records !== 'object' ||
      Array.isArray(records)) {
    throw new TypeError('catalog.standards must be an object');
  }

  const provided = Object.keys(records).sort();
  if (JSON.stringify(required) !== JSON.stringify(provided)) {
    throw new Error('catalogue snapshot does not match roadmap references');
  }

  for (const id of provided) {
    const value = records[id];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`invalid standard: ${id}`);
    }
    for (const key of Object.keys(value)) {
      if (![
        'id', 'reference', 'title', 'status',
        'publicationDate', 'edition', 'committee', 'ics'
      ].includes(key)) {
        throw new Error(`unexpected ISO attribute: ${key}`);
      }
    }
  }

  // Return a detached snapshot, not a reference to caller-owned data.
  return plain({
    format: input.format,
    version: input.version,
    roadmap: {
      id: input.roadmap.id,
      title: input.roadmap.title,
      publishedRevisionId: input.roadmap.publishedRevisionId
    },
    catalog: {
      release: input.catalog.release ?? null,
      standards: records
    },
    graph
  });
}

export function readRoadmapPackage(json) {
  return validateRoadmapPackage(
    typeof json === 'string' ? JSON.parse(json) : json
  );
}
