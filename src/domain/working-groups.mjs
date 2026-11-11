/** Pure extraction of working-group projections from legacy js/radar.js. */
export function getWorkingGroups(blips) {
  const workingGroups = [...new Set(blips.map(d => d.working_group))];
  return workingGroups.map(group => ({ id: group, text: group }));
}

export function getWorkingGroupsWithCount(blips) {
  const counts = blips.reduce((acc, d) => {
    acc[d.working_group] = (acc[d.working_group] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([group, count]) => ({ text: group, count: count }));
}
