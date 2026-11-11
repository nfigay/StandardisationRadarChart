/* S14-Z — simplified catalogue sources manager; classic script, no ES import. */
(function (root) {
  'use strict';
  if (root.__radarS14Z) return;
  const d = root.document;
  const wording = {
    fr: {
      manage: 'Catalogue ISO', title: 'Catalogue de normalisation', catalogue: 'Catalogue installé', check: 'Vérifier les mises à jour',
      advanced: 'Administration avancée', close: 'Fermer', source: 'Source de distribution', release: 'Publication',
      deliverables: 'Normes et projets', committees: 'Comités TC/SC', ics: 'Classifications ICS',
      changes: 'Journal des évolutions', rss: 'Actualités RSS', unknown: 'Non renseigné', unavailable: 'Non disponible',
      notPublished: 'Non publié', unchanged: 'Déjà à jour', updated: 'Mis à jour', error: 'Échec',
      running: 'Synchronisation en cours…', completed: 'Synchronisation terminée', notConfigured: 'Aucune source configurée',
      technical: 'Opérations techniques (administration ou mode hors ligne)', local: 'Charger des fichiers ISO locaux',
      import: 'Importer un JSONL', journal: 'Charger le journal', feeds: 'Actualiser les RSS locaux', refresh: 'Reconstruire les vues',
      informational: 'Les données sont enregistrées dans IndexedDB de ce navigateur. Le service HTTP est uniquement la source de distribution.',
      silent: 'La commande a été déclenchée, mais aucun résultat structuré n’a été confirmé.',
      failed: 'La synchronisation a échoué : ', noCommand: 'La commande de synchronisation est indisponible.',
      warning: 'Aucune donnée ne sera téléchargée depuis ISO directement par cette commande.'
    },
    en: {
      manage: 'ISO catalogue', title: 'Standards catalogue', catalogue: 'Installed catalogue', check: 'Check for updates',
      advanced: 'Advanced administration', close: 'Close', source: 'Distribution source', release: 'Release',
      deliverables: 'Standards and projects', committees: 'Committees TC/SC', ics: 'ICS classifications',
      changes: 'Change journal', rss: 'RSS updates', unknown: 'Unknown', unavailable: 'Unavailable',
      notPublished: 'Not published', unchanged: 'Up to date', updated: 'Updated', error: 'Failed',
      running: 'Synchronizing…', completed: 'Synchronization completed', notConfigured: 'No source configured',
      technical: 'Technical operations (administration or offline mode)', local: 'Load local ISO files',
      import: 'Import JSONL', journal: 'Load journal', feeds: 'Refresh local RSS', refresh: 'Rebuild views',
      informational: 'Data is stored in this browser’s IndexedDB. The HTTP service is only a distribution source.',
      silent: 'The command was started, but no structured result was confirmed.',
      failed: 'Synchronization failed: ', noCommand: 'Synchronization command is unavailable.',
      warning: 'This command does not download data directly from ISO.'
    }
  };
  const state = {bar:null, modal:null, result:null};
  const lang = () => /^en\b/i.test(root.i18next?.resolvedLanguage || root.i18next?.language || 'fr') ? 'en' : 'fr';
  const t = key => wording[lang()][key] || key;
  function node(tag, parent, label, styles) {
    const el = d.createElement(tag);
    if (label !== undefined) el.textContent = String(label);
    if (styles) el.style.cssText = styles;
    if (parent) parent.appendChild(el);
    return el;
  }
  function findCommand(code) {
    return Array.from(state.bar?.querySelectorAll('button') || [])
      .find(b => b.dataset?.isoTranslation === code) || null;
  }
  function statusText(value) {
    if (value === 'unchanged') return t('unchanged');
    if (value === 'updated' || value === 'installed' || value === 'success') return t('updated');
    if (value === 'not-published' || value === 'not-configured') return t('notPublished');
    if (value === 'error' || value === 'failed') return t('error');
    return value == null ? t('unknown') : String(value);
  }
  async function snapshot() {
    let release = null, norms = null, committees = null, source = null;
    try {
      const active = await root.__radarIsoWindowed?.current?.();
      release = active?.summary?.release || null;
      norms = active?.summary?.datasets?.deliverables?.count ?? null;
      committees = active?.summary?.datasets?.committees?.count ?? null;
    } catch (_) { /* read-only status unavailable */ }
    try {
      const r = await root.fetch('./radar-catalog-config.json', {cache:'no-store'});
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const cfg = await r.json();
        if (typeof cfg.endpoint === 'string' && cfg.endpoint.trim()) source = new URL(cfg.endpoint, root.location.href).href;
      }
    } catch (_) { /* optional config */ }
    const latest = root.__radarLastCatalogSync || state.result;
    return {release, norms, committees, source: latest?.endpoint || source, latest};
  }
  function line(parent, title, value) {
    const row = node('div',parent,undefined,'display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:6px 0;border-bottom:1px solid #e5e5e5');
    node('span',row,title,'font-weight:600');
    node('span',row,value,'text-align:right;overflow-wrap:anywhere');
  }
  async function renderStatus(panel) {
    const data = await snapshot();
    if (!panel.isConnected) return;
    panel.replaceChildren();
    line(panel,t('release'),data.release || t('unknown'));
    line(panel,t('deliverables'),data.norms == null ? t('unknown') : data.norms.toLocaleString(lang()));
    line(panel,t('committees'),data.committees == null ? t('unknown') : data.committees.toLocaleString(lang()));
    line(panel,t('source'),data.source || t('notConfigured'));
    line(panel,t('ics'),statusText(data.latest?.ics?.status));
    if (data.latest?.iso) line(panel,'ISO',statusText(data.latest.iso.status));
    if (data.latest?.release && data.latest.release !== data.release) line(panel,'Release remote',data.latest.release);
    if (data.latest?.warnings?.length) line(panel,'Attention',data.latest.warnings.join('; '));
  }
  function activateCommand(code) {
    const cmd = findCommand(code);
    if (!cmd) return false;
    cmd.click(); // Must remain in the actual user gesture for file selectors.
    return true;
  }
  function dismiss() {
    state.modal?.remove(); state.modal=null;
  }

  // S14.2-B2 — Purely informational help for the main catalogue window.
  const VISUAL_GUIDES={
    fr:{
      distributedSync:[
        'Vérifier les mises à jour',
        'Recherche une publication ISO plus récente et peut installer son catalogue dans ce navigateur.',
        ['Distribution publiée','Vérification','Catalogue local'],
        'Ne modifie ni les blips ni les révisions des radars.'
      ],
      sync:[
        'Charger les fichiers ISO locaux',
        'Utilise les fichiers locaux configurés dans ce déploiement.',
        ['Fichiers locaux','Chargement','Catalogue ISO'],
        'La présence de cette source est facultative.'
      ],
      import:[
        'Importer un JSONL',
        'Choisit un fichier fourni par l’utilisateur pour importer des notices ISO.',
        ['Fichier JSONL','Import','Notices ISO'],
        'Vérifiez toujours la provenance du fichier.'
      ],
      changesLoad:[
        'Charger le journal des évolutions',
        'Présente les changements disponibles entre publications ISO.',
        ['Publications ISO','Journal','Évolutions'],
        'Le journal est facultatif et distinct des normes.'
      ],
      rssSync:[
        'Actualiser les actualités RSS',
        'Consulte des actualités issues des flux locaux configurés.',
        ['Flux RSS','Cache local','Actualités'],
        'Les flux RSS ne remplacent pas le catalogue ISO.'
      ],
      refresh:[
        'Reconstruire les vues',
        'Rafraîchit les vues à partir des données disponibles.',
        ['Données locales','Actualisation','Vues du radar'],
        'Ne télécharge pas une nouvelle distribution ISO.'
      ]
    },
    en:{
      distributedSync:[
        'Check for updates',
        'Checks for a newer published ISO release and may install it in this browser.',
        ['Published distribution','Check','Local catalogue'],
        'Does not modify radar blips or revisions.'
      ],
      sync:[
        'Load local ISO files',
        'Uses configured local files from this deployment.',
        ['Local files','Load','ISO catalogue'],
        'This source is optional.'
      ],
      import:[
        'Import JSONL',
        'Selects a user-provided file containing ISO records.',
        ['JSONL file','Import','ISO records'],
        'Always check the file source.'
      ],
      changesLoad:[
        'Load change journal',
        'Shows available changes between published ISO releases.',
        ['ISO releases','Journal','Changes'],
        'The journal is optional and separate from standards.'
      ],
      rssSync:[
        'Refresh RSS news',
        'Reads news from locally configured RSS feeds.',
        ['RSS feeds','Local cache','News'],
        'RSS news does not replace the ISO catalogue.'
      ],
      refresh:[
        'Rebuild views',
        'Refreshes views using currently available data.',
        ['Local data','Refresh','Radar views'],
        'Does not download a new ISO distribution.'
      ]
    }
  };

  function visualDiagram(parent,steps){
    const ns='http://www.w3.org/2000/svg';
    if(typeof d.createElementNS!=='function'){
      node('p',parent,steps.join(' → '));
      return;
    }
    const svg=d.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 600 120');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',steps.join(' → '));
    svg.style.cssText='width:100%;height:auto;display:block';

    const add=(tag,attributes,text)=>{
      const child=d.createElementNS(ns,tag);
      for(const [key,value] of Object.entries(attributes)){
        child.setAttribute(key,String(value));
      }
      if(text!==undefined)child.textContent=text;
      svg.appendChild(child);
    };

    steps.forEach((step,i)=>{
      const x=4+202*i;
      add('rect',{
        x,y:20,width:178,height:80,rx:10,
        fill:'#e7eff9',stroke:'#6887a6',
        'stroke-width':1.5
      });
      const words=step.split(' ');
      const half=Math.ceil(words.length/2);
      const first=words.slice(0,half).join(' ');
      const second=words.slice(half).join(' ');
      add('text',{
        x:x+89,y:second?53:65,
        'text-anchor':'middle','font-size':13,
        fill:'#203b58'
      },first);
      if(second)add('text',{
        x:x+89,y:74,
        'text-anchor':'middle','font-size':13,
        fill:'#203b58'
      },second);
      if(i<2){
        add('path',{
          d:'M'+(x+182)+' 60 h15 m-5 -5 l5 5 -5 5',
          fill:'none',stroke:'#467096','stroke-width':2
        });
      }
    });
    parent.appendChild(svg);
  }

  function renderVisualGuide(panel,operation){
    if(!panel)return;
    const entry=VISUAL_GUIDES[lang()][operation];
    if(!entry)return;
    const [title,description,steps,effect]=entry;

    panel.textContent='';
    node('strong',panel,title,'font-size:15px');
    node('p',panel,description,
      'line-height:1.5;margin:8px 0');
    visualDiagram(panel,steps);
    node('p',panel,effect,
      'line-height:1.5;margin:8px 0 0;padding-left:10px;border-left:3px solid #6887a6');
  }

  function renderDataExplanation(dialog){
    const details=node('details',dialog,undefined,
      'margin-top:12px;border:1px solid #ccd5df;padding:10px;border-radius:7px');
    node('summary',details,
      lang()==='en'?'Understand the data':'Comprendre les données',
      'cursor:pointer;font-weight:600');

    const content=node('div',details,undefined,
      'padding-top:10px;line-height:1.5');
    visualDiagram(content,lang()==='en'?
      ['Published files','Browser storage','ISO catalogue']:
      ['Fichiers publiés','Stockage navigateur','Catalogue ISO']);

    const entries=lang()==='en'?[
      ['Source','Origin of the information.'],
      ['Dataset','A coherent collection of data.'],
      ['Distribution','Published files delivering a dataset.'],
      ['Datastore','Storage used by an application.'],
      ['Browser IndexedDB','Local storage of the ISO catalogue.'],
      ['Radar data','Blips, groups and revisions, distinct from ISO reference data.']
    ]:[
      ['Source','Origine des informations.'],
      ['Dataset','Ensemble cohérent de données.'],
      ['Distribution','Fichiers publiés pour transférer un dataset.'],
      ['Datastore','Espace de conservation des données.'],
      ['IndexedDB','Stockage local du catalogue dans le navigateur.'],
      ['Données du radar','Blips, groupes et révisions, distincts des données ISO.']
    ];
    for(const [name,description] of entries){
      const p=node('p',content,undefined,'margin:5px 0');
      node('strong',p,name+' : ');
      node('span',p,description);
    }
  }

  function open() {
    dismiss();
    const shade=node('div',d.body,undefined,'position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box');
    state.modal=shade;
    shade.addEventListener('click',e=>{if(e.target===shade)dismiss();});
    const dialog=node('section',shade,undefined,'background:#fff;color:#222;width:min(700px,98vw);max-height:90vh;overflow:auto;border-radius:8px;padding:18px;box-shadow:0 10px 40px #0004;font:14px Arial,sans-serif');
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',t('title'));
    const head=node('div',dialog,undefined,'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px');
    node('strong',head,t('title'),'font-size:19px');
    const close=node('button',head,t('close'));close.type='button';close.addEventListener('click',dismiss);
    node('strong',dialog,t('catalogue'));
    const summary=node('div',dialog,undefined,'padding:9px 0 13px');
    const hint=node('p',dialog,t('informational'),'color:#666;font-size:12px');
    const button=node('button',dialog,t('check'),'display:block;background:#215b8c;color:white;padding:10px 15px;border:0;border-radius:4px;cursor:pointer;margin:14px 0');
    button.type='button';
    const note=node('div',dialog,t('warning'),'padding:8px 0;color:#555;font-size:12px');
    const visualPanel=node('section',dialog,undefined,
      'margin:12px 0;padding:12px;background:#f7f9fc;color:#24364b;border:1px solid #bccbd9;border-radius:8px');
    visualPanel.id='s142-catalogue-visual-guide';
    visualPanel.setAttribute('role','region');
    visualPanel.setAttribute('aria-label',
      lang()==='en'?'Catalogue action guide':'Aide illustrée du catalogue');
    renderVisualGuide(visualPanel,'distributedSync');

    const log=node('div',dialog,'','white-space:pre-wrap;padding:9px;border:1px solid #ddd;border-radius:4px;min-height:22px');
    log.setAttribute('role','status');log.setAttribute('aria-live','polite');
    button.addEventListener('mouseenter',
      ()=>renderVisualGuide(visualPanel,'distributedSync'));
    button.addEventListener('focus',
      ()=>renderVisualGuide(visualPanel,'distributedSync'));
    button.addEventListener('click',async()=>{
      if (!findCommand('distributedSync')) {log.textContent=t('noCommand');return;}
      button.disabled=true;
      log.textContent=t('running');
      const previous=root.__radarLastCatalogSync;
      activateCommand('distributedSync');
      const started=Date.now();
      const poll=()=>{
        const value=root.__radarLastCatalogSync;
        if (!shade.isConnected) return;
        if (value && value !== previous) {
          state.result=value;
          log.textContent=value.status==='error' ? t('failed')+String(value.message||'') :
            t('completed')+' · ISO: '+statusText(value.iso?.status)+' · ICS: '+statusText(value.ics?.status);
          if(value.warnings?.length)log.textContent+=' · '+value.warnings.join('; ');
          button.disabled=false;
          void renderStatus(summary);
          return;
        }
        if (Date.now()-started > 120000) {log.textContent=t('silent');button.disabled=false;void renderStatus(summary);return;}
        root.setTimeout(poll,300);
      };
      root.setTimeout(poll,300);
    });
    const details=node('details',dialog,undefined,'margin-top:15px;border-top:1px solid #ccc;padding-top:12px');
    node('summary',details,t('advanced'),'cursor:pointer;font-weight:600');
    node('p',details,t('technical'),'color:#555;font-size:12px');
    for (const [op,key] of [['sync','local'],['import','import'],['changesLoad','journal'],['rssSync','feeds'],['refresh','refresh']]) {
      if (!findCommand(op)) continue;
      const b=node('button',details,t(key),'padding:6px 9px;margin:5px 7px 5px 0;cursor:pointer');b.type='button';
      b.addEventListener('mouseenter',
        ()=>renderVisualGuide(visualPanel,op));
      b.addEventListener('focus',
        ()=>renderVisualGuide(visualPanel,op));
      b.addEventListener('click',()=>{if (!activateCommand(op))log.textContent=t('unavailable');else log.textContent=t('technical')+': '+t(key);});
    }
    renderDataExplanation(dialog);
    const onKey=e=>{if(e.key==='Escape'){dismiss();d.removeEventListener('keydown',onKey);}};
    d.addEventListener('keydown',onKey);
    close.focus();
    void renderStatus(summary);
  }
  function decorate() {
    const previous=d.querySelector('button[data-iso-manage-sources="true"]');
    if (!previous || !previous.parentElement) return false;
    const bar=previous.parentElement;
    state.bar=bar;
    previous.style.display='none';previous.setAttribute('aria-hidden','true');previous.tabIndex=-1;
    if (bar.querySelector('[data-s14-z-manage]')) return true;
    const btn=node('button',null,t('manage'));
    btn.type='button';btn.dataset.s14ZManage='true';btn.className='w2ui-btn';btn.addEventListener('click',open);
    bar.insertBefore(btn,previous.nextSibling);
    return true;
  }
  root.__radarS14Z=Object.freeze({open,decorate,snapshot});
  if (!decorate()) {
    const observer=new root.MutationObserver(()=>{if(decorate())observer.disconnect();});
    observer.observe(d.documentElement,{childList:true,subtree:true});
    root.addEventListener('load',()=>{if(decorate())observer.disconnect();},{once:true});
  }
})(window);
