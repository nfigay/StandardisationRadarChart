import {
  readPublishedRoadmapProjection
} from '../src/domain/roadmap-published-projection.mjs';

const NS = 'http://www.w3.org/2000/svg';

// Pure data-to-view conversion, independent of DOM and ISO services.
export function createClientView(input) {
  const pkg = readPublishedRoadmapProjection(input);
  const standards = new Map(
    pkg.standards.map(s => [s.standardId, s])
  );
  const assessments = new Map(
    pkg.assessments.map(a => [a.assessmentId, a])
  );

  const positions = pkg.blips.map(b => b.position);
  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 1;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const span = Math.max(width, height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const items = pkg.blips.map(b => ({
    id: b.blipId,
    label: b.label,
    ring: b.ring,
    quadrant: b.quadrant,
    x: 300 + 490 * (b.position.x - centerX) / span,
    y: 300 + 490 * (b.position.y - centerY) / span,
    standard: standards.get(b.standardId),
    assessment: b.assessmentId
      ? assessments.get(b.assessmentId)
      : null
  }));

  return {
    id: pkg.roadmap.radarId,
    title: pkg.roadmap.title || pkg.roadmap.radarId,
    revision: pkg.roadmap.revisionId,
    version: pkg.roadmap.version || '',
    organization: pkg.organization.name || '',
    items
  };
}

function element(parent, tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  parent.appendChild(el);
  return el;
}

function svgElement(parent, tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }
  parent.appendChild(el);
  return el;
}

export function mountClient(doc = document) {
  const input = doc.getElementById('package-file');
  const message = doc.getElementById('message');
  const title = doc.getElementById('roadmap-title');
  const meta = doc.getElementById('roadmap-meta');
  const radar = doc.getElementById('radar');
  const list = doc.getElementById('items');
  const details = doc.getElementById('details');

  if ([input, message, title, meta, radar, list, details]
    .some(x => !x)) {
    throw Error('client DOM is incomplete');
  }

  function render(view) {
    title.textContent = view.title;
    meta.textContent = [
      'Révision : ' + view.revision,
      view.version && 'Version : ' + view.version,
      view.organization && 'Organisation : ' + view.organization,
      view.items.length + ' éléments'
    ].filter(Boolean).join(' · ');

    radar.replaceChildren();
    list.replaceChildren();
    details.textContent = 'Sélectionnez un élément.';

    // Positional guide only; not a claim of semantic ring boundaries.
    for (const radius of [85, 160, 245]) {
      svgElement(radar, 'circle', {
        cx:300, cy:300, r:radius,
        fill:'none', stroke:'#d4dfeb',
        'stroke-width':1.5
      });
    }
    svgElement(radar, 'line', {
      x1:55,y1:300,x2:545,y2:300,
      stroke:'#d4dfeb'
    });
    svgElement(radar, 'line', {
      x1:300,y1:55,x2:300,y2:545,
      stroke:'#d4dfeb'
    });

    const buttons = new Map();
    const circles = new Map();

    function select(item) {
      for (const [id, button] of buttons) {
        button.setAttribute('aria-pressed',
          String(id === item.id));
      }
      for (const [id, circle] of circles) {
        circle.setAttribute('stroke',
          id === item.id ? '#d97706' : '#ffffff');
        circle.setAttribute('stroke-width',
          id === item.id ? 5 : 2);
      }
      details.replaceChildren();
      element(details,'p','Norme : '+
        (item.standard?.name || item.standard?.standardId || '—'));
      element(details,'p','Anneau : '+item.ring);
      element(details,'p','Quadrant : '+item.quadrant);
      if (item.assessment) {
        element(details,'p','Évaluation : '+
          (item.assessment.name ||
           item.assessment.title ||
           item.assessment.assessmentId));
      }
    }

    view.items.forEach((item, index) => {
      const point = svgElement(radar,'circle',{
        cx:item.x,cy:item.y,r:8,
        fill:'#326fa8',stroke:'#ffffff',
        'stroke-width':2
      });
      circles.set(item.id,point);
      const label=svgElement(radar,'text',{
        x:item.x+11,y:item.y-9,
        'font-size':11,fill:'#24364b'
      });
      label.textContent=String(index+1);

      const li=element(list,'li');
      const button=element(li,'button',
        (index+1)+'. '+item.label);
      button.type='button';
      button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>select(item));
      buttons.set(item.id,button);
    });

    if (view.items.length) select(view.items[0]);
  }

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    message.textContent = 'Lecture du paquet…';
    message.className = '';

    try {
      const contents = await file.text();
      const view = createClientView(contents);
      render(view);
      message.textContent =
        'Roadmap publiée chargée : '+view.items.length+' éléments.';
    } catch (error) {
      title.textContent='Aucune roadmap chargée';
      meta.textContent='';
      radar.replaceChildren();
      list.replaceChildren();
      details.textContent='Aucun paquet valide chargé.';
      message.className='error';
      message.textContent =
        'Paquet refusé : '+String(error?.message || error);
    }
  });

  return {render};
}

if (typeof document !== 'undefined' &&
    document.getElementById('package-file')) {
  mountClient(document);
}
