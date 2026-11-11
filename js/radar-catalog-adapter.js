/* Phase 10A: explicit, synchronous catalog revision adapter.
 * No automatic fetch, no automatic activation, no persistence changes.
 * Existing session revisions remain authoritative after first selection.
 */
(function(root) {
  'use strict';
  var registered = Object.create(null);
  function fail(message) { throw new Error('Radar catalog: ' + message); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function nonempty(x) { return typeof x === 'string' && x.trim().length > 0; }
  function own(x, k) { return Object.prototype.hasOwnProperty.call(x, k); }
  function register(group, revision) {
    if (!nonempty(group)) fail('group must be non-empty');
    if (own(registered, group)) fail('group already registered: ' + group);
    if (!revision || revision.schemaVersion !== '1.0.0' ||
        !nonempty(revision.revisionId) || !nonempty(revision.radarId) ||
        !nonempty(revision.ownerOrganizationId) ||
        !nonempty(revision.portfolioId) ||
        !['draft', 'published', 'archived'].includes(revision.status) ||
        !Array.isArray(revision.blips)) fail('invalid revision metadata');
    var seen = new Set();
    revision.blips.forEach(function(b) {
      if (!b || !nonempty(b.blipId) || !nonempty(b.standardId) ||
          !nonempty(b.label) || !nonempty(b.ring) || !nonempty(b.quadrant) ||
          !b.position || !Number.isFinite(b.position.x) ||
          !Number.isFinite(b.position.y)) fail('invalid blip');
      if (seen.has(b.blipId)) fail('duplicate blipId: ' + b.blipId);
      seen.add(b.blipId);
    });
    // Never change an existing historical or in-session group implicitly.
    if (root.__radarRevisionSession &&
        root.__radarRevisionSession.status().groups.includes(group))
      fail('group already initialised by session: ' + group);
    registered[group] = clone(revision);
    return { group: group, revisionId: revision.revisionId, blips: revision.blips.length };
  }
  function project(group) {
    if (!own(registered, group)) fail('unregistered group: ' + group);
    var revision = clone(registered[group]);
    return { nodes: revision.blips.map(function(b) {
      return {
        group: 'nodes',
        data: {
          id: b.blipId, label: b.label, ring: b.ring,
          quadrant: b.quadrant, working_group: group, type: 'business-object',
          radarchart: {
            blipId: b.blipId, standardId: b.standardId,
            assessmentId: b.assessmentId || null,
            radarId: revision.radarId, revisionId: revision.revisionId,
            ownerOrganizationId: revision.ownerOrganizationId,
            portfolioId: revision.portfolioId,
            context: clone(b.context || {}), extensions: clone(b.extensions || {})
          }
        }, position: {x: b.position.x, y: b.position.y}
      };
    }), edges: [] };
  }
  root.__radarCatalogAdapter = Object.freeze({
    register: register, unregister:function(g) {
      if(!own(registered,g))fail('cannot remove unknown group: '+g);
      delete registered[g];
    }, has: function(g) { return own(registered, g); },
    getRevision: function(g) { return own(registered,g) ? clone(registered[g]) : null; },
    replaceRevision:function(group, revision, expectedStatus) {
      if (!own(registered, group) || registered[group].status !== expectedStatus ||
          revision?.revisionId !== registered[group].revisionId ||
          revision?.radarId !== registered[group].radarId ||
          revision?.status !== (expectedStatus === 'draft' ? 'published' : 'archived') ||
          !Array.isArray(revision.blips)) fail('invalid revision transition');
      registered[group] = clone(revision);
      return {group:group,status:revision.status};
    },
    project: project, status: function() { return Object.keys(registered).sort(); }
  });
})(window);
