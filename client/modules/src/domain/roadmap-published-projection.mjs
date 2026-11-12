/*
 * S14.3-A2 — Native catalog revision -> minimal client projection.
 * Experimental v2; does not supersede the A1 v1 contract yet.
 * No browser, network, IndexedDB or Cytoscape dependency.
 */

const text = (x) => typeof x === 'string' && x.trim().length > 0;

function requireText(value, field) {
  if (!text(value)) throw Error('invalid ' + field);
  return value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function select(object, fields) {
  const result = {};
  for (const field of fields) {
    if (Object.hasOwn(object, field)) {
      result[field] = clone(object[field]);
    }
  }
  return result;
}

function lookup(records, key, value, kind) {
  const matches = records.filter(record => record?.[key] === value);
  if (matches.length !== 1) {
    throw Error('unresolved or ambiguous ' + kind + ': ' + value);
  }
  return matches[0];
}

export function createPublishedRoadmapProjection(catalog, revisionId) {
  requireText(revisionId, 'revisionId');

  if (!catalog || typeof catalog !== 'object') {
    throw Error('invalid catalog');
  }

  for (const field of [
    'radarRevisions', 'standards', 'organizations', 'portfolios'
  ]) {
    if (!Array.isArray(catalog[field])) {
      throw Error('missing catalog array: ' + field);
    }
  }

  if (catalog.assessments != null &&
      !Array.isArray(catalog.assessments)) {
    throw Error('invalid assessments');
  }

  const revision = lookup(
    catalog.radarRevisions, 'revisionId', revisionId, 'revision'
  );

  if (revision.status !== 'published') {
    throw Error('only published revisions may be projected');
  }

  if (!Array.isArray(revision.blips)) {
    throw Error('invalid revision blips');
  }

  const organization = lookup(
    catalog.organizations,
    'organizationId',
    requireText(revision.ownerOrganizationId, 'ownerOrganizationId'),
    'organization'
  );

  const portfolio = lookup(
    catalog.portfolios,
    'portfolioId',
    requireText(revision.portfolioId, 'portfolioId'),
    'portfolio'
  );

  if (portfolio.ownerOrganizationId !== organization.organizationId) {
    throw Error('organization / portfolio mismatch');
  }

  const standards = new Map();
  const assessments = new Map();
  const blipIds = new Set();

  const blips = revision.blips.map(blip => {
    if (!blip || typeof blip !== 'object') {
      throw Error('invalid blip');
    }

    const id = requireText(blip.blipId, 'blipId');
    const standardId = requireText(blip.standardId, 'standardId');

    if (blipIds.has(id)) throw Error('duplicate blipId: ' + id);
    blipIds.add(id);

    requireText(blip.label, 'label');
    requireText(blip.ring, 'ring');
    requireText(blip.quadrant, 'quadrant');

    if (!Number.isFinite(blip.position?.x) ||
        !Number.isFinite(blip.position?.y)) {
      throw Error('invalid blip position: ' + id);
    }

    const standard = lookup(
      catalog.standards, 'standardId', standardId, 'standard'
    );

    standards.set(standardId, select(standard, [
      'standardId', 'name'
    ]));

    if (blip.assessmentId != null) {
      const assessmentId = requireText(
        blip.assessmentId, 'assessmentId'
      );
      const assessment = lookup(
        catalog.assessments || [],
        'assessmentId',
        assessmentId,
        'assessment'
      );
      assessments.set(assessmentId, select(assessment, [
        'assessmentId', 'name', 'title'
      ]));
    }

    // Only known render fields are emitted at this stage.
    // Context/extensions require explicit semantic review.
    return select(blip, [
      'blipId', 'standardId', 'assessmentId',
      'label', 'ring', 'quadrant', 'position'
    ]);
  });

  const result = {
    format: 'standardisation-roadmap',
    version: 2,
    lifecycle: 'published',
    roadmap: select(revision, [
      'revisionId', 'radarId', 'version', 'title',
      'ownerOrganizationId', 'portfolioId'
    ]),
    organization: select(organization, [
      'organizationId', 'name'
    ]),
    portfolio: select(portfolio, [
      'portfolioId', 'ownerOrganizationId', 'name'
    ]),
    blips,
    standards: [...standards.values()].sort(
      (a, b) => a.standardId.localeCompare(b.standardId)
    ),
    assessments: [...assessments.values()].sort(
      (a, b) => a.assessmentId.localeCompare(b.assessmentId)
    )
  };

  return clone(result);
}

export function readPublishedRoadmapProjection(input) {
  const value = typeof input === 'string' ?
    JSON.parse(input) : input;

  if (!value || value.format !== 'standardisation-roadmap' ||
      value.version !== 2 ||
      value.lifecycle !== 'published') {
    throw Error('unsupported published roadmap projection');
  }

  // Reading alone is not publication authorization.
  // Validate against the same reference-closure constraints.
  const catalog = {
    radarRevisions: [{
      ...value.roadmap,
      status: 'published',
      blips: value.blips
    }],
    organizations: [value.organization],
    portfolios: [value.portfolio],
    standards: value.standards,
    assessments: value.assessments
  };

  return createPublishedRoadmapProjection(
    catalog, value.roadmap?.revisionId
  );
}
