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


  // S14.2-B3: data flows explained by the selected command.
  // Fields: title, description, origin, originPlace, processing,
  // transfer, destination, destinationPlace, impact, condition.
  const COMMAND_FLOWS={
    fr:{
      distributedSync:{
        title:'Vérifier les mises à jour',
        description:'Compare le catalogue installé avec la distribution publiée.',
        origin:'GitHub Pages',
        originPlace:'Serveur Internet — distribution ISO publiée',
        processing:'Comparer / installer',
        transfer:'Lecture HTTP ; téléchargement si une installation est nécessaire',
        destination:'IndexedDB',
        destinationPlace:'Stockage du navigateur — catalogue ISO',
        impact:'Peut installer et activer une nouvelle génération ISO. Les blips et révisions du radar ne sont pas concernés.',
        condition:'Une distribution accessible et la connexion réseau sont nécessaires pour une nouvelle installation.'
      },
      sync:{
        title:'Charger des fichiers ISO locaux',
        description:'Lit les fichiers ISO locaux configurés pour ce déploiement.',
        origin:'Fichiers servis',
        originPlace:'Fichiers du déploiement accessibles par HTTP',
        processing:'Charger',
        transfer:'Lecture de fichiers locaux au site, s’ils sont configurés',
        destination:'Catalogue ISO',
        destinationPlace:'Données ISO disponibles dans le navigateur',
        impact:'Peut mettre à jour les données ISO locales utilisées pour la consultation.',
        condition:'Ne choisit pas un fichier sur votre disque. La source doit être configurée.'
      },
      import:{
        title:'Importer un JSONL',
        description:'Utilise un fichier de notices ISO choisi sur votre ordinateur.',
        origin:'Disque local',
        originPlace:'Fichier JSONL sélectionné par l’utilisateur',
        processing:'Lire / importer',
        transfer:'Lecture d’un fichier fourni via le sélecteur du navigateur',
        destination:'Données ISO',
        destinationPlace:'Catalogue local de l’application',
        impact:'Peut modifier les notices ISO locales importées, sans être une mise à jour GitHub Pages.',
        condition:'Vérifiez la provenance et le format du fichier.'
      },
      changesLoad:{
        title:'Charger le journal',
        description:'Consulte les évolutions disponibles entre publications.',
        origin:'Journal publié',
        originPlace:'Fichier de changements, si présent sur le site',
        processing:'Lire / afficher',
        transfer:'Lecture de la ressource facultative',
        destination:'Évolutions',
        destinationPlace:'Affichage du journal dans l’application',
        impact:'Affiche des changements documentés ; n’installe pas une génération ISO.',
        condition:'Le journal peut être absent du déploiement.'
      },
      rssSync:{
        title:'Actualiser les RSS locaux',
        description:'Charge les actualités de sources RSS locales configurées.',
        origin:'Cache RSS servi',
        originPlace:'Fichiers RSS locaux du déploiement',
        processing:'Lire / actualiser',
        transfer:'Lecture des ressources facultatives',
        destination:'Actualités RSS',
        destinationPlace:'Cache et consultation des actualités dans le navigateur',
        impact:'Actualise les actualités disponibles ; ne remplace pas les notices ISO.',
        condition:'La source RSS doit être configurée et accessible.'
      },
      refresh:{
        title:'Reconstruire les vues',
        description:'Rafraîchit l’affichage à partir des données déjà disponibles.',
        origin:'Données locales',
        originPlace:'Données déjà disponibles dans l’application',
        processing:'Rafraîchir',
        transfer:'Traitement local — pas de téléchargement de distribution',
        destination:'Vues affichées',
        destinationPlace:'Interface de consultation du radar',
        impact:'Actualise les vues et représentations ; ne télécharge pas le catalogue ISO.',
        condition:'Nécessite uniquement les données déjà disponibles.'
      }
    },
    en:{
      distributedSync:{
        title:'Check for updates',
        description:'Compares the installed catalogue with the published distribution.',
        origin:'GitHub Pages',
        originPlace:'Internet server — published ISO distribution',
        processing:'Compare / install',
        transfer:'HTTP read; download if installation is needed',
        destination:'IndexedDB',
        destinationPlace:'Browser storage — ISO catalogue',
        impact:'May install and activate a new ISO generation. Radar blips and revisions are not affected.',
        condition:'An accessible distribution and network connection are needed for a new installation.'
      },
      sync:{
        title:'Load local ISO files',
        description:'Reads ISO files configured for this deployment.',
        origin:'Served files',
        originPlace:'Deployment files available over HTTP',
        processing:'Load',
        transfer:'Read site-local files if configured',
        destination:'ISO catalogue',
        destinationPlace:'ISO data available in the browser',
        impact:'May update locally available ISO reference data.',
        condition:'Does not select a file from your disk. The source must be configured.'
      },
      import:{
        title:'Import JSONL',
        description:'Uses an ISO records file selected on your computer.',
        origin:'Local disk',
        originPlace:'User-selected JSONL file',
        processing:'Read / import',
        transfer:'Read a file through the browser file picker',
        destination:'ISO data',
        destinationPlace:'Local application catalogue',
        impact:'May change imported local ISO records, not the GitHub Pages distribution.',
        condition:'Check the file format and provenance.'
      },
      changesLoad:{
        title:'Load change journal',
        description:'Reads available differences between releases.',
        origin:'Published journal',
        originPlace:'Optional change file served by the site',
        processing:'Read / display',
        transfer:'Read optional resource',
        destination:'Changes',
        destinationPlace:'Change journal view',
        impact:'Displays documented changes; does not install an ISO generation.',
        condition:'The journal might be absent.'
      },
      rssSync:{
        title:'Refresh local RSS',
        description:'Reads news from configured local RSS sources.',
        origin:'Served RSS cache',
        originPlace:'Site-local RSS files',
        processing:'Read / refresh',
        transfer:'Read optional resources',
        destination:'RSS news',
        destinationPlace:'Browser news cache and view',
        impact:'Refreshes available news, not ISO standard records.',
        condition:'The RSS source must be configured and accessible.'
      },
      refresh:{
        title:'Rebuild views',
        description:'Refreshes the display using existing information.',
        origin:'Local data',
        originPlace:'Data already available to the application',
        processing:'Refresh',
        transfer:'Local processing — no distribution download',
        destination:'Displayed views',
        destinationPlace:'Radar consultation interface',
        impact:'Refreshes the views; does not download the ISO catalogue.',
        condition:'Requires only already available data.'
      }
    }
  };

  function renderVisualGuide(panel,operation){
    if(!panel)return;
    const flow=(COMMAND_FLOWS[lang()]||COMMAND_FLOWS.fr)[operation];
    if(!flow)return;

    panel.textContent='';
    panel.setAttribute('data-command-flow',operation);

    node('strong',panel,flow.title,'font-size:16px');
    node('p',panel,flow.description,
      'line-height:1.4;margin:6px 0 8px');

    // The diagram describes the actual endpoints, not generic boxes.
    visualDiagram(panel,[
      flow.origin,flow.processing,flow.destination
    ]);

    const locations=node('div',panel,undefined,
      'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:5px');

    const source=node('div',locations,undefined,
      'padding:8px;border:1px solid #c4d3e2;border-radius:6px;min-width:0');
    node('strong',source,lang()==='en'?'FROM':'DÉPART',
      'font-size:11px;color:#435c73');
    node('div',source,flow.originPlace,
      'font-size:12px;line-height:1.4;margin-top:3px;overflow-wrap:anywhere');

    const destination=node('div',locations,undefined,
      'padding:8px;border:1px solid #c4d3e2;border-radius:6px;min-width:0');
    node('strong',destination,lang()==='en'?'TO':'ARRIVÉE',
      'font-size:11px;color:#435c73');
    node('div',destination,flow.destinationPlace,
      'font-size:12px;line-height:1.4;margin-top:3px;overflow-wrap:anywhere');

    const transfer=node('p',panel,undefined,
      'margin:9px 0 4px;line-height:1.4;font-size:12px');
    node('strong',transfer,lang()==='en'?'FLOW — ':'FLUX — ');
    node('span',transfer,flow.transfer);

    const impact=node('p',panel,undefined,
      'margin:7px 0 4px;line-height:1.4;padding:8px;border-left:3px solid #6887a6');
    node('strong',impact,lang()==='en'?'CHANGES — ':'CE QUI CHANGE — ');
    node('span',impact,flow.impact);

    node('p',panel,flow.condition,
      'margin:6px 0 0;font-size:12px;color:#516276;line-height:1.4');
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
