function getWorkingGroups() {
  const workingGroups = [...new Set(ASD_SSG_Blips.map(d => d.working_group))];
  return workingGroups.map(group => ({ id: group, text: group }));
}

function getWorkingGroupsWithCount() {
  // Count occurrences of each working group
  const counts = ASD_SSG_Blips.reduce((acc, d) => {
    acc[d.working_group] = (acc[d.working_group] || 0) + 1;
    return acc;
  }, {});

  // Convert to menu format
  return Object.entries(counts).map(([group, count]) => ({
    text: group,
    count: count
  }));
}
