const validRings = ["Adopted", "Candidate", "Track"];
const validQuadrants = ["", "Available", "Monitored", "Participated", "Developed"];
var allowZoneChanges = false;
var backToInitialPosition;

function drawSelectedWorkgroup(workgroup) {
  let RadarInputs = ASD_SSG_Blips.filter(blip => blip.working_group === workgroup);
  let filteredBlips = RadarInputs.filter(d => validRings.includes(d.ring) && validQuadrants.includes(d.quadrant));

  plotData(filteredBlips);
}

function generateFormFromCytoscapeElement(ele) {
  if (!ele || !ele.isNode()) return;

  let data = ele.data();
  let position = ele.position();
  let formFields = {};

  // === BLIP TAB ===
  formFields["Blip"] = {
    type: 'tab',
    fields: {
      "Radar Info": {
        type: 'group',
        fields: {
          "id": { type: 'text', label: 'ID', disabled: true, value: data.id || '' },
          "label": { type: 'text', label: 'Label', value: data.label || '' },
          "ring": {
            type: 'list', label: 'Ring',
            options: { items: validRings },
            value: data.ring || '',
            disabled: true
          },
          "quadrant": {
            type: 'list', label: 'Quadrant',
            options: { items: validQuadrants },
            value: data.quadrant || '',
            disabled: true
          }
        }
      }
    }
  };

  // === CONTEXT TAB ===
  formFields["Context"] = {
    type: 'tab',
    fields: {
      "Details": {
        type: 'group',
        fields: {
          "name": { type: 'text', label: 'Name', value: data.name || '' },
          "hasBlip": { type: 'checkbox', label: 'Has Blip', value: data.hasBlip === "TRUE" },
          "description": { type: 'textarea', label: 'Description', value: data.description || '' },
          "Priority": {
            type: 'list', label: 'Priority',
            options: { items: ['P1', 'P2', 'P3'] },
            value: data.Priority || 'P1'
          },
          "Status Version": { type: 'text', label: 'Status Version', value: data["Status Version"] || '' },
          "Responsible": { type: 'text', label: 'Responsible', value: data.Responsible || '' },
          "specialisation": { type: 'text', label: 'Specialisation', value: data.specialisation || '' },
          "type": { type: 'text', label: 'Type', value: data.type || '' }
        }
      }
    }
  };

  // === EXTRA TAB FOR UNKNOWN FIELDS ===
  let extraFields = {};
  const predefinedKeys = new Set([
    "id", "label", "ring", "quadrant", "name", "hasBlip", "description",
    "Priority", "Status Version", "Responsible", "specialisation", "type"
  ]);

  Object.keys(data).forEach(key => {
    if (!predefinedKeys.has(key) && key !== "pos") {
      extraFields[key] = {
        type: 'text',
        label: key.replace(/_/g, " "),
        value: data[key] || ''
      };
    }
  });

  if (Object.keys(extraFields).length > 0) {
    formFields["Extra"] = {
      type: 'tab',
      fields: {
        "Additional Properties": {
          type: 'group',
          fields: extraFields
        }
      }
    };
  }

  // === FORM CONFIG ===
  let formConfig = {
    name: 'blipForm',
    fields: formFields,
    record: data,
    actions: {
      Save() {
        let updatedData = this.record;
        Object.keys(updatedData).forEach(key => {
          if (!key.startsWith("position.")) {
            let value = updatedData[key];
            if (key === 'ring' || key === 'quadrant') {
              value = value?.id || value;
            }
            ele.data(key, value);
          }
        });
        ele.cy().style().update();
        w2ui['blipForm'].refresh();
      },
      Cancel() { w2ui['blipForm'].clear(); }
    }
  };

  return new w2form(formConfig);
}

function initializeToolbar2() {
  alert("initializetoolbar2")
}

function getWorkingGroups() {
  const workingGroups = [...new Set(ASD_SSG_Blips.map(d => d.working_group))];
  return workingGroups.map(group => ({ id: group, text: group }));
}

function getWorkingGroupsWithCount() {
  const counts = ASD_SSG_Blips.reduce((acc, d) => {
    acc[d.working_group] = (acc[d.working_group] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([group, count]) => ({
    text: group,
    count: count
  }));
}

function filterBlipsByWorkingGroup(selectedGroup) {
  const filtered = ASD_SSG_Blips.filter(d => d.working_group === selectedGroup);
  console.log("Filtered Blips for Working Group:", selectedGroup, filtered);
  plotData(filtered);
}

let originalZones = new Map();
const zoneRingMapping = {
  2: "Track",
  1: "Candidate",
  0: "Adopted"
};

const quadrantMapping = {
  1: "Monitored",
  0: "Available",
  2: "Participated",
  3: "Developed"
};

const chartCenter = { x: 400, y: 400 };
const radii = [150, 250, 350];

function getZone(x, y, radii) {
  let relX = x - chartCenter.x;
  let relY = y - chartCenter.y;
  let r = Math.sqrt(relX ** 2 + relY ** 2);
  
  if (r > radii[radii.length - 1]) {
    return { zone: undefined, quadrant: undefined };
  }

  let ringIndex = radii.findIndex(radius => r < radius);
  if (ringIndex === -1) ringIndex = radii.length - 1;

  let theta = Math.atan2(relY, relX);
  let angleDeg = (theta * 180) / Math.PI;
  if (angleDeg < 0) {
    angleDeg += 360;
  }

  let quadrantIndex;
  if (angleDeg >= 0 && angleDeg < 90) {
    quadrantIndex = 0;
  } else if (angleDeg >= 90 && angleDeg < 180) {
    quadrantIndex = 1;
  } else if (angleDeg >= 180 && angleDeg < 270) {
    quadrantIndex = 2;
  } else {
    quadrantIndex = 3;
  }

  return { zone: ringIndex, quadrant: quadrantIndex };
}

function enableNodeGrabbing() {
  cy.nodes().grabify();
}

function disableNodeGrabbing() {
  cy.nodes().ungrabify();
}

function openCSV(file) {
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        myBlips = processCSVData(results.data);
        displayBlips(myBlips);
      }
    });
  }
}

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
    ring: row.ring,
    quadrant: row.quadrant,
    name: row.name,
    hasBlip: row.hasBlip,
    description: row.description,
    standard_type1: row.standard_type1,
  }));
}

function displayBlips(blips) {
  document.getElementById('output').textContent = JSON.stringify(blips, null, 2);
}

function filterBlipsByRadarType(radarType) {
  return myBlips.filter(blip => {
    return blip[`in_${radarType}_radar`] === 'Y';
  });
}

function drawSVG() {
  ringSizes = [
    { ringSize: 350, ringColor: "white", text: "Track" },
    { ringSize: 250, ringColor: "white", text: "Candidate" },
    { ringSize: 150, ringColor: "white", text: "Adopted" }
  ];
  
  let container = d3.select("#svg-container");

  if (container.empty()) {
    console.error("❌ #svg-container does not exist!");
    return;
  }

  let containerNode = container.node();
  if (!containerNode) {
    console.error("❌ container.node() is null!");
    return;
  }

  let width = containerNode.clientWidth;
  let height = containerNode.clientHeight;

  container.select("svg").remove();

  let svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  // TITLE
  svg
    .append("text")
    .attr("id", "svgTitle")
    .style("font-size", "25px")
    .text(`Standards Radar Chart ` + new Date().toLocaleDateString())
    .attr("x", -200)
    .attr("y", -370)
    .attr("fill", "black");

  // RINGS
  ringSizes.forEach((ring) => {
    svg.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", ring.ringSize)
      .attr("fill", ring.ringColor)
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  });

  // AXES
  const maxRadius = ringSizes[0].ringSize;
  const axisThickness = 20;
  const axisColor = "rgba(169, 169, 169, 0.2)";

  svg.append("line")
    .attr("x1", -maxRadius + 10)
    .attr("y1", 0)
    .attr("x2", maxRadius - 10)
    .attr("y2", 0)
    .attr("stroke", axisColor)
    .attr("stroke-width", axisThickness)
    .attr("stroke-linecap", "round");

  svg.append("line")
    .attr("x1", 0)
    .attr("y1", -maxRadius + 10)
    .attr("x2", 0)
    .attr("y2", maxRadius - 10)
    .attr("stroke", axisColor)
    .attr("stroke-width", axisThickness)
    .attr("stroke-linecap", "round");

  // RING LABELS
  function createRingLabel(text, radius) {
    svg.append("text")
      .attr("font-size", "15px")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text(text)
      .attr("x", 0)
      .attr("y", -radius + 20);
  }

  createRingLabel("Adopted", 150);
  createRingLabel("Candidate", 250);
  createRingLabel("Track", 350);

  // QUARTER LABELS
  function createQuarterLabel(id, x, y, text) {
    let block = svg
      .append("foreignObject")
      .attr("id", id)
      .attr("x", x)
      .attr("y", y)
      .attr("width", 200)
      .attr("height", 150)
      .attr("class", "svg-quarter-title");

    block.append("xhtml:div")
      .append("div")
      .style("display", "table")
      .attr("font-family", "futura")
      .attr("font-weight", "bold")
      .style("color", "#0000FF")
      .style("font-size", "15px")
      .append("p")
      .style("display", "table-cell")
      .style("text-align", "center")
      .style("vertical-align", "middle")
      .html(text);
  }

  createQuarterLabel("quarter1", -330, -310, "Monitored External Development");
  createQuarterLabel("quarter2", 180, -310, "Available External<br> Standards");
  createQuarterLabel("quarter3", 180, 250, "Participate<br>in External<br>Development");
  createQuarterLabel("quarter4", -320, 230, "ASD<br>Development");
}

function plotData(RadarInputs) {
  cy.elements().remove();

  const validRings = ["Adopted", "Candidate", "Track"];
  const validQuadrants = ["Available", "Monitored", "Participated", "Developed"];

  var filteredBlips = RadarInputs.filter(d =>
    validRings.includes(d.ring) && validQuadrants.includes(d.quadrant)
  );

  filteredBlips.forEach(d => {
    let radiusRange;
    if (d.ring === "Adopted") radiusRange = [30, 130];
    else if (d.ring === "Candidate") radiusRange = [180, 230];
    else if (d.ring === "Track") radiusRange = [280, 320];

    d.radius = d3.randomUniform(radiusRange[0], radiusRange[1])();

    let angleRange;
    if (d.quadrant === "Monitored") {
      angleRange = [0, Math.PI / 2];
    } else if (d.quadrant === "Available") {
      angleRange = [Math.PI / 2, Math.PI];
    } else if (d.quadrant === "Developed") {
      angleRange = [Math.PI, 3 * Math.PI / 2];
    } else if (d.quadrant === "Participated") {
      angleRange = [3 * Math.PI / 2, 2 * Math.PI];
    }
    
    let newPoints = d3.pointRadial(
      d3.randomUniform(angleRange[0], angleRange[1])(),
      d.radius
    );

    d.x = newPoints[0] + 400;
    d.y = newPoints[1] + 400;
  });

  const elements = filteredBlips.map(blip => ({
    data: { id: blip.label, ...blip },
    position: { x: blip.x, y: blip.y }
  }));

  cy.add(elements);
  cy.nodes().ungrabify();
  allowZoneChanges = false;
  
  let toolbarItem = w2ui.toolbar.get('item4');
  if (toolbarItem) {
      toolbarItem.selected = 'locked';
      w2ui.toolbar.refresh('item4'); 
  }
 
  cy.fit();
}

function downloadCompleteRadarData() {
  cy.nodes().ungrabify();
  const jsonData = cy.json();
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'radar.json';
  a.click();
  URL.revokeObjectURL(url);
}

function loadRadarData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      cy.elements().remove();
      cy.json(jsonData);
      cy.nodes().ungrabify();
      console.log("Radar data successfully loaded.");
    } catch (error) {
      console.error("Error loading radar data:", error);
      alert("Invalid JSON file.");
    }
  };
}

// Corrected remote fetching functions
const proxy = 'https://cors-anywhere.herokuapp.com/';

async function checkProxyActive() {
    try {
        const testUrl = proxy + 'https://example.com/';
        const res = await fetch(testUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (res.status === 403) {
            window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
            return false;
        }
        return true;
    } catch (err) {
        console.error('Proxy check failed:', err);
        return false;
    }
}

function getText(doc, selector) {
    const el = doc.querySelector(selector);
    return el ? el.textContent.trim() : 'N/A';
}

function findByText(doc, tagName, containsText) {
    const elements = doc.getElementsByTagName(tagName);
    for (const el of elements) {
        if (el.textContent && el.textContent.includes(containsText)) {
            return el.textContent.trim();
        }
    }
    return '';
}

function extractISOData(doc) {
    const data = {};
    data.title = getText(doc, 'h1.title');
    data.status = getText(doc, '.publication-details span.status-value');
    data.committee = getText(doc, '.technical-committee span.field-value');
    data.abstract = getText(doc, '.abstract-text');
    return data;
}

async function fetchISO(url) {
    const isProxyActive = await checkProxyActive();
    if (!isProxyActive) {
        throw new Error('Please activate the proxy and try again.');
    }

    try {
        const response = await fetch(proxy + url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');

        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const jsonData = JSON.parse(script.textContent);
                if (jsonData['@type'] && (jsonData['@type'].includes('Product') || jsonData['@type'].includes('CreativeWork'))) {
                    return jsonData;
                }
            } catch (e) {
                console.warn('JSON-LD parse error:', e);
            }
        }

        return extractISOData(doc);
    } catch (error) {
        console.error('Fetch error:', error);
        throw new Error(`Failed to fetch ISO page: ${error.message}`);
    }
}

async function handleFetchISO() {
    console.log('handleFetchISO called');
    const output = document.getElementById('output');
    if (!output) {
        alert('Error: No output element found with id="output"');
        return;
    }

    const url = prompt('Enter ISO standard URL:', 'https://www.iso.org/standard/36173.html');
    
    if (!url) {
        output.textContent = 'Cancelled by user';
        return;
    }
    
    output.textContent = 'Fetching ISO data...';

    try {
        const data = await fetchISO(url.trim());
        output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        const errorMsg = 'Error: ' + (err.message || err);
        output.textContent = errorMsg;
        console.error('Full error:', err);
    }
}

async function handleFetchISOWithW2Prompt() {
    console.log('handleFetchISOWithW2Prompt called');
    const output = document.getElementById('output');
    if (!output) {
        alert('Error: No output element found with id="output"');
        return;
    }

    if (typeof w2prompt === 'undefined') {
        console.error('w2prompt is not defined, falling back to basic prompt');
        return handleFetchISO();
    }
    
    w2prompt({
        label: 'Enter ISO standard URL:',
        value: 'https://www.iso.org/standard/36173.html',
        title: 'Fetch ISO Data',
        width: 500,
        ok_label: 'Fetch'
    }).then(async (url) => {
        if (!url) {
            output.textContent = 'Cancelled by user';
            return;
        }

        output.textContent = 'Fetching ISO data...';

        try {
            const data = await fetchISO(url.trim());
            output.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            const errorMsg = 'Error: ' + (err.message || err);
            output.textContent = errorMsg;
            console.error('Full error:', err);
        }
    }).catch(() => {
        output.textContent = 'Cancelled by user';
    });
}

function testFunctions() {
    console.log('Testing function availability:');
    console.log('extractISOData:', typeof extractISOData);
    console.log('fetchISO:', typeof fetchISO);
    console.log('handleFetchISO:', typeof handleFetchISO);
}

console.log('ISO fetcher script loaded');
testFunctions();