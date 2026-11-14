/* Phase 9E: session-only, per-working-group editable Cytoscape snapshots.
 * Does not alter the existing composite SSR save/load format.
 * This module is loaded synchronously before js/radar.js (classic script).
 */
(function (root) {
  'use strict';
  var revisions = Object.create(null);
  var activeGroup = null;
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function assertGroup(group) {
    if (typeof group !== 'string' || !group.trim()) throw new Error('Radar revision requires working group');
    return group;
  }
  function snapshot(graph) {
    var elements = graph.elements().jsons();
    return copy({
      nodes: elements.filter(function (e) { return e.group === 'nodes' || (!e.data.source && !e.data.target); }),
      edges: elements.filter(function (e) { return e.group === 'edges' || (e.data.source && e.data.target); })
    });
  }
  function capture(graph) {
    if(root.__radarApplicationProfile?.viewer)return;
    if (activeGroup !== null) revisions[activeGroup] = snapshot(graph);
  }
  function restore(graph, value) {
    var nodes = copy(value.nodes);
    var edges = copy(value.edges);
    graph.elements().remove();
    graph.add(nodes.concat(edges));
    // Keep each node's original grabbable state restored by graph.add().
    root.__radarViewportSync?.();
  }
  function select(graph, group, initialise) {
    if(root.__radarApplicationProfile?.viewer){
      root.__radarApplicationProfile.assertRevision(
        root.__radarCatalogAdapter?.getRevision?.(group)
      );
    }
    assertGroup(group);
    if (activeGroup === group) return;
    capture(graph);
    if (Object.prototype.hasOwnProperty.call(revisions, group)) {
      restore(graph, revisions[group]);
    } else {
      initialise(group); // existing plotData, exactly once for this group
      revisions[group] = snapshot(graph);
    }
    activeGroup = group;
  }
  function adoptLoaded(graph) {
    root.__radarApplicationProfile?.require("graph.import");
    // Existing SSR files do not identify the selected radar at graph root.
    // Only infer it when *every* node has the same known working_group.
    var nodes = graph.nodes().jsons();
    var groups = Array.from(new Set(nodes.map(function (n) { return n.data.working_group; })));
    if (nodes.length && groups.length === 1 && typeof groups[0] === 'string' && groups[0].trim()) {
      activeGroup = groups[0];
      revisions[activeGroup] = snapshot(graph);
      return activeGroup;
    }
    activeGroup = null;
    return null;
  }
  function removeGroup(graph, group) {
    root.__radarApplicationProfile?.require("workspace.remove");
    assertGroup(group);
    // Removing an active group clears the displayed graph instead of taking a snapshot
    // that would resurrect a deleted radar on subsequent selection.
    if (activeGroup === group) {
      graph.elements().remove();
      activeGroup = null;
    }
    delete revisions[group];
  }
  function beforeExternalReplace(graph) { capture(graph); activeGroup = null; }
  function releaseCatalog(graph,groups){
    root.__radarApplicationProfile?.require('catalog.open');
    if(!Array.isArray(groups))throw Error('Invalid catalog groups');
    if(activeGroup!==null && groups.includes(activeGroup)){
      graph.elements().remove();activeGroup=null;
    }
    for(var group of groups)delete revisions[group];
    return {released:groups.length};
  }
  root.__radarRevisionSession = Object.freeze({
    releaseCatalog:releaseCatalog,
    select: select, capture: capture, adoptLoaded: adoptLoaded, removeGroup: removeGroup,
    exportGroup: function (graph, group) {
      assertGroup(group);
      if (activeGroup === group) return snapshot(graph);
      return Object.prototype.hasOwnProperty.call(revisions, group) ? copy(revisions[group]) : null;
    },
    beforeExternalReplace: beforeExternalReplace,
    status: function () {
      return { activeGroup: activeGroup, groups: Object.keys(revisions).sort() };
    }
  });
})(window);
