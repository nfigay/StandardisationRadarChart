function processCSVData(csvData) {
  return csvData.map(row => ({
    id: row.id,
    working_group: row.working_group,
    in_pda_radar: row.in_pda_radar,
    in_se_radar: row.in_se_radar,
    in_ils_radar: row.in_ils_radar,
    in_manuf_radar: row.in_manuf_radar,
    in_tli_radar: row.in_tli_radar,
    in_supply_chain_radar: row.in_supply_chain_radar,
    label: row.label,
    ring: row.ring,  // ring corresponds to zone
    quadrant: row.quadrant,  // quadrant corresponds to quarter
    name: row.name,
    hasBlip: row.hasBlip,
    description: row.description,
    standard_type1: row.standard_type1,
    // Additional fields can go here
  }));
}
