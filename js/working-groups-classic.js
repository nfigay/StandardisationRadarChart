// Generated from src/domain/working-groups.mjs; do not edit.
(() => {
  // src/domain/working-groups.mjs
  function getWorkingGroups(blips) {
    const workingGroups = [...new Set(blips.map((d) => d.working_group))];
    return workingGroups.map((group) => ({ id: group, text: group }));
  }
  function getWorkingGroupsWithCount(blips) {
    const counts = blips.reduce((acc, d) => {
      acc[d.working_group] = (acc[d.working_group] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([group, count]) => ({ text: group, count }));
  }

  // ../../../../../../../var/folders/l5/ctd2328n68vb7l4986jpqnxm0000gn/T/radarchart-groups-preflight-CvZw1m/working-groups-sync-entry.mjs
  window.__radarWorkingGroups = Object.freeze({ getWorkingGroups, getWorkingGroupsWithCount });
})();
