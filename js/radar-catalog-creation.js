/* Lot 1 — synchronous creation commands for active JSON catalog drafts.
 * Standards live in catalog persistence; only blips are Cytoscape elements.
 * No plotData(), no parallel catalog and no mutation of published revisions.
 */
(function (root) {
  'use strict';
  function fail(code, message) {
    var e = new Error('Catalog creation: ' + message);
    e.code = code;
    throw e;
  }
  function object(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function str(x) { return typeof x === 'string' && x.trim().length > 0; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function id(prefix) {
    if (!root.crypto || typeof root.crypto.randomUUID !== 'function')
      fail('UUID_UNAVAILABLE', 'secure UUID generator unavailable');
    return prefix + root.crypto.randomUUID();
  }
  function execute(graph, request, createStandard) {
    var session = root.__radarRevisionSession;
    var adapter = root.__radarCatalogAdapter;
    var persistence = root.__radarCatalogPersistence;
    if (!graph || typeof graph.add !== 'function' || typeof graph.$id !== 'function' ||
        !session || !adapter || !persistence || typeof persistence.commitCreation !== 'function')
      fail('APP_NOT_READY', 'graph or catalog services unavailable');
    if (!object(request)) fail('INVALID_REQUEST', 'request must be an object');
    var group = session.status().activeGroup;
    var revision = adapter.getRevision(group);
    if (!revision) fail('NOT_CATALOG_REVISION', 'active group is not an imported catalog revision');
    if (revision.status !== 'draft') fail('REVISION_NOT_DRAFT', 'creation requires draft revision');
    if (persistence.status().importedCatalogs !== 1 ||
        !persistence.ownsRevision(group, revision.revisionId))
      fail('CATALOG_UNAVAILABLE', 'active draft is not owned by the unique catalog');
    if (!str(request.label) || !str(request.ring) || !str(request.quadrant))
      fail('INVALID_VISUAL', 'label, ring and quadrant are required');
    if (!object(request.position) || !Number.isFinite(request.position.x) ||
        !Number.isFinite(request.position.y))
      fail('INVALID_POSITION', 'finite x/y position is required');
    if (request.assessmentId != null && !str(request.assessmentId))
      fail('INVALID_ASSESSMENT', 'assessmentId must be non-empty or null');
    if (request.context != null && !object(request.context))
      fail('INVALID_CONTEXT', 'context must be an object');
    if (request.extensions != null && !object(request.extensions))
      fail('INVALID_EXTENSIONS', 'extensions must be an object');
    var standard = null;
    var standardId;
    if (createStandard) {
      if (!object(request.standard) || !str(request.standard.name))
        fail('INVALID_STANDARD', 'standard object with name is required');
      standard = clone(request.standard);
      standardId = standard.standardId || id('standard_');
      if (!str(standardId)) fail('INVALID_STANDARD', 'invalid standardId');
      standard.standardId = standardId;
    } else {
      standardId = request.standardId;
      if (!str(standardId)) fail('INVALID_STANDARD', 'standardId is required');
    }
    var blipId = request.blipId == null ? id('blip_') : request.blipId;
    if (!str(blipId) || blipId === standardId)
      fail('INVALID_BLIP', 'invalid blipId');
    if (graph.$id(blipId).length || graph.$id(standardId).length)
      fail('GRAPH_ID_CONFLICT', 'proposed ID already present in graph');
    var blip = {
      blipId:blipId, standardId:standardId, label:request.label,
      ring:request.ring, quadrant:request.quadrant,
      position:{x:request.position.x,y:request.position.y},
      assessmentId:request.assessmentId || null,
      context:clone(request.context || {}),
      extensions:clone(request.extensions || {})
    };
    // The adapter's existing exact projection shape is reused for the new node.
    var node = {
      group:'nodes',
      data:{
        id:blipId,label:blip.label,ring:blip.ring,quadrant:blip.quadrant,
        working_group:group,type:'business-object',
        radarchart:{
          blipId:blipId,standardId:standardId,assessmentId:blip.assessmentId,
          radarId:revision.radarId,revisionId:revision.revisionId,
          ownerOrganizationId:revision.ownerOrganizationId,
          portfolioId:revision.portfolioId,
          context:clone(blip.context),extensions:clone(blip.extensions)
        }
      },position:clone(blip.position)
    };
    // Validate persistence references and collisions before any graph mutation.
    persistence.validateCreation({group:group,revisionId:revision.revisionId,
      standard:standard,blip:blip});
    if (session.status().activeGroup !== group ||
        adapter.getRevision(group)?.status !== 'draft')
      fail('REVISION_CHANGED', 'active draft changed during preparation');
    var preexisting = graph.$id(blipId).length;
    var addAttempted = false;
    try {
      addAttempted = true;
      graph.add(node);
      if (graph.$id(blipId).length !== 1)
        fail('GRAPH_ADD_INCOMPLETE', 'blip was not inserted');
      persistence.commitCreation({group:group,revisionId:revision.revisionId,
        standard:standard,blip:blip});
      return Object.freeze({blipId:blipId,standardId:standardId,
        revisionId:revision.revisionId,added:true});
    } catch (error) {
      if (addAttempted && !preexisting) {
        try {
          var inserted = graph.$id(blipId);
          if (inserted.length) graph.remove(inserted);
        } catch (rollbackError) {
          throw new AggregateError([error,rollbackError],
            'Catalog creation failed; graph rollback also failed');
        }
      }
      throw error;
    }
  }
  root.__radarCatalogCreation = Object.freeze({
    addBlipToActiveDraft:function(graph,request){return execute(graph,request,false);},
    addStandardBlipToActiveDraft:function(graph,request){return execute(graph,request,true);}
  });
})(window);
