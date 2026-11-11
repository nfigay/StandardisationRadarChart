import { prepareCSVSSRImport, applyCSVSSRImport } from '../domain/csv-ssr-import.mjs';
import { processCSVData } from '../domain/csv-projection.mjs';
import { getZone } from '../domain/radar-zone.mjs';

// Compatibility adapter for classic scripts and existing Cytoscape handlers.
// No listener, renderer, state copy or secondary calculation is created.
window.__radarGetZone = getZone;
window.__radarProcessCSVData = processCSVData;
window.__radarCSVSSR = { prepareCSVSSRImport, applyCSVSSRImport };
