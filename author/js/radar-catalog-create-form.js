/* Lot 2 — optional dialog entrypoint for catalog draft creation.
 * No secondary catalog, no layout invocation, no historic ASD mutation.
 */
(function(root){
  'use strict';
  // Register in the existing application i18next instance, never a second instance.
  var dict={
  "fr": {
    "title": "Ajouter un blip",
    "newTitle": "Créer un standard et son blip",
    "search": "Rechercher un standard du catalogue",
    "searchPlaceholder": "Nom ou identifiant (catalogue importé)",
    "selected": "Standard sélectionné",
    "standardName": "Nom du standard de référence",
    "manualNote": "Création manuelle dans ce catalogue ; ne constitue pas une vérification auprès de l’ISO.",
    "blipLabel": "Libellé du blip",
    "ring": "Anneau du blip",
    "quadrant": "Quadrant du blip",
    "positionHint": "Position initiale automatique dans la zone visible ; les blips existants ne sont pas déplacés.",
    "cancel": "Annuler",
    "create": "Créer",
    "results": "— {{count}} résultat(s), 50 maximum —",
    "created": "Blip créé : {{id}}",
    "Adopted": "Adopté",
    "Candidate": "Candidat",
    "Track": "À suivre",
    "Available": "Disponible",
    "Monitored": "Suivi",
    "Participated": "Participation",
    "Developed": "Développé",
    "draft": "Sélectionnez d’abord un brouillon du catalogue.",
    "ownership": "Le brouillon actif ne fait pas partie du catalogue modifiable.",
    "graph": "Graphe indisponible.",
    "viewport": "Zone visible du graphe indisponible.",
    "mode": "Mode de création invalide.",
    "visual": "Renseignez le libellé, l’anneau et le quadrant du blip.",
    "engine": "Moteur de création indisponible.",
    "standard": "Sélectionnez un standard de ce catalogue.",
    "requiredName": "Le nom du standard est obligatoire.",
    "alreadyOpen": "Un formulaire de création est déjà ouvert.",
    "noStandard": "Aucun standard disponible : créez d’abord un standard et son blip.",
    "changed": "Le radar actif a changé : rouvrez le formulaire.",
    "failed": "Création impossible. Consultez la console pour les détails techniques."
  },
  "en": {
    "title": "Add blip",
    "newTitle": "Create standard and blip",
    "search": "Search catalog standards",
    "searchPlaceholder": "Name or identifier (imported catalog)",
    "selected": "Selected standard",
    "standardName": "Reference standard name",
    "manualNote": "Manual creation in this catalog; not verification by ISO.",
    "blipLabel": "Blip label",
    "ring": "Blip ring",
    "quadrant": "Blip quadrant",
    "positionHint": "Initial position is set automatically in the visible area; existing blips are not moved.",
    "cancel": "Cancel",
    "create": "Create",
    "results": "— {{count}} result(s), 50 maximum —",
    "created": "Blip created: {{id}}",
    "Adopted": "Adopted",
    "Candidate": "Candidate",
    "Track": "Track",
    "Available": "Available",
    "Monitored": "Monitored",
    "Participated": "Participated",
    "Developed": "Developed",
    "draft": "Select a catalog draft first.",
    "ownership": "The active draft is not part of the editable catalog.",
    "graph": "Graph unavailable.",
    "viewport": "Graph viewport unavailable.",
    "mode": "Invalid creation mode.",
    "visual": "Enter the blip label, ring and quadrant.",
    "engine": "Creation engine unavailable.",
    "standard": "Select a standard from this catalog.",
    "requiredName": "Standard name is required.",
    "alreadyOpen": "A creation form is already open.",
    "noStandard": "No standard exists: create a standard and blip first.",
    "changed": "Active radar changed: reopen the form.",
    "failed": "Creation failed. See the console for technical details."
  }
};
  var registeredI18n=null;
  function t(key,options){
    var instance=root.i18next;
    if(instance?.addResourceBundle && registeredI18n!==instance){
      for(var language of ['fr','en'])instance.addResourceBundle(language,'translation',{menu:{blipForm:dict[language]}},true,true);
      registeredI18n=instance;
    }
    var locale=String(instance?.resolvedLanguage||instance?.language||'fr').toLowerCase().split('-')[0];
    var fallback=(dict[locale]||dict.en)[key]||key;
    var full='menu.blipForm.'+key;
    var value=instance?.t?.(full,{...options,defaultValue:fallback});
    if(value&&value!==full)return value;
    return fallback.replace(/\{\{(\w+)\}\}/g,(_,name)=>String(options?.[name]??''));
  }
  var errorKeys={"Select a catalog draft first": "draft", "The active draft is not part of the editable catalog": "ownership", "Graph unavailable": "graph", "Graph viewport unavailable": "viewport", "Invalid creation mode": "mode", "Label and valid radar ring/quadrant are required": "visual", "Creation engine unavailable": "engine", "Select a standard from this catalog": "standard", "Standard name is required": "requiredName", "A creation form is already open": "alreadyOpen", "No standard exists: create a standard and blip first": "noStandard", "Selected standard is not in this catalog": "standard", "Active radar changed: reopen the form": "changed"};
  function fail(message){throw Error('Catalog form: '+message);}
  function errorMessage(error){
    var message=String(error?.message||error);
    var key=errorKeys[message.replace(/^Catalog form: /,'')];
    if(!key)root.console?.error?.('Catalog form rejected',error);
    return t(key||'failed');
  }
  function active(){
    var group=root.__radarRevisionSession?.status?.().activeGroup;
    var revision=root.__radarCatalogAdapter?.getRevision?.(group);
    if(!revision || revision.status!=='draft') fail('Select a catalog draft first');
    if(root.__radarCatalogPersistence?.status?.().importedCatalogs!==1 ||
       !root.__radarCatalogPersistence.ownsRevision(group,revision.revisionId))
      fail('The active draft is not part of the editable catalog');
    return {group:group,revision:revision};
  }
  function initialPosition(graph){
    if(!graph || typeof graph.extent!=='function' || typeof graph.nodes!=='function')
      fail('Graph unavailable');
    var extent=graph.extent();
    if(!extent || ![extent.x1,extent.x2,extent.y1,extent.y2].every(Number.isFinite))
      fail('Graph viewport unavailable');
    var cx=(extent.x1+extent.x2)/2,cy=(extent.y1+extent.y2)/2;
    var nodes=graph.nodes();
    var positions=nodes.map(function(n){return n.position();});
    var span=Math.max(20,Math.min(Math.abs(extent.x2-extent.x1),Math.abs(extent.y2-extent.y1))/12);
    // Bounded deterministic search; never moves any existing node.
    for(var i=0;i<80;i++){
      var a=i*2.399963229728653,r=span*Math.sqrt(i+1);
      var x=Math.max(extent.x1+8,Math.min(extent.x2-8,cx+Math.cos(a)*r));
      var y=Math.max(extent.y1+8,Math.min(extent.y2-8,cy+Math.sin(a)*r));
      if(positions.every(function(p){return !p || Math.hypot(p.x-x,p.y-y)>18;}))
        return {x:x,y:y};
    }
    return {x:cx,y:cy};
  }
  // Values are the currently supported geometry of the legacy radar renderer.
  // Do not infer additional values from standard metadata or existing blips.
  var rings=Object.freeze(['Adopted','Candidate','Track']);
  var quadrants=Object.freeze(['Available','Monitored','Participated','Developed']);
  function filterStandards(standards,query,limit){
    var q=String(query||'').trim().toLocaleLowerCase();
    var n=Number.isInteger(limit)&&limit>0?limit:50;
    return standards.filter(function(s){return (s.standardId+' '+s.name).toLocaleLowerCase().includes(q);}).slice(0,n);
  }
  function submit(graph,kind,fields){
    var target=active();
    if(kind!=='existing' && kind!=='new') fail('Invalid creation mode');
    var label=String(fields.label||'').trim(),ring=String(fields.ring||'').trim();
    var quadrant=String(fields.quadrant||'').trim();
    if(!label || !rings.includes(ring) || !quadrants.includes(quadrant)) fail('Label and valid radar ring/quadrant are required');
    var request={label:label,ring:ring,quadrant:quadrant,position:initialPosition(graph)};
    var creation=root.__radarCatalogCreation;
    if(!creation) fail('Creation engine unavailable');
    if(kind==='existing'){
      var standards=root.__radarCatalogPersistence.listStandardsForDraft(target.group,target.revision.revisionId);
      if(!standards.some(function(s){return s.standardId===fields.standardId;}))
        fail('Select a standard from this catalog');
      request.standardId=fields.standardId;
      return creation.addBlipToActiveDraft(graph,request);
    }
    var name=String(fields.standardName||'').trim();
    if(!name) fail('Standard name is required');
    request.standard={name:name};
    return creation.addStandardBlipToActiveDraft(graph,request);
  }
  function open(graph,kind,preselectedStandardId){
    var target=active();
    if(kind!=='existing' && kind!=='new') fail('Invalid creation mode');
    if(root.document.getElementById('catalog-create-dialog'))
      fail('A creation form is already open');
    var standards=root.__radarCatalogPersistence.listStandardsForDraft(target.group,target.revision.revisionId);
    if(kind==='existing' && !standards.length) fail('No standard exists: create a standard and blip first');
    var d=root.document,overlay=d.createElement('div');
    overlay.id='catalog-create-dialog';
    Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'100000',background:'rgba(0,0,0,.55)',display:'grid',placeItems:'center'});
    var form=d.createElement('form');
    Object.assign(form.style,{background:'#fff',color:'#222',padding:'22px',width:'min(440px,92vw)',boxSizing:'border-box',borderRadius:'8px',display:'grid',gap:'12px'});
    var localeBindings=[];
    function bind(element,property,key,options){
      function update(){element[property]=t(key,typeof options==='function'?options():options);}
      localeBindings.push(update);update();
    }
    var lastError=null;
    function refreshLanguage(){localeBindings.forEach(function(update){update();});}
    function close(){root.i18next?.off?.('languageChanged',refreshLanguage);overlay.remove();}
    var heading=d.createElement('h2');bind(heading,'textContent',kind==='new'?'newTitle':'title');
    heading.style.margin='0';heading.style.fontSize='18px';form.appendChild(heading);
    function field(labelKey,name,required,selectValues){
      var wrapper=d.createElement('label');var label=d.createElement('span');bind(label,'textContent',labelKey);wrapper.appendChild(label);
      wrapper.style.display='grid';wrapper.style.gap='4px';
      var input=d.createElement(selectValues?'select':'input');input.name=name;input.required=!!required;
      if(!selectValues){input.type='text';input.maxLength=200;}
      else {
        var blank=d.createElement('option');blank.value='';blank.textContent='—';input.appendChild(blank);
        selectValues.forEach(function(s){var option=d.createElement('option');option.value=s.value;bind(option,'textContent',s.label);input.appendChild(option);});
      }
      input.style.width='100%';input.style.boxSizing='border-box';if(selectValues){input.style.height='36px';input.style.minHeight='36px';input.style.maxHeight='36px';input.style.padding='4px 8px';input.style.display='block';input.style.fontSize='14px';}wrapper.appendChild(input);form.appendChild(wrapper);
      return input;
    }
    var standardInput;
    if(kind==='existing'){
      var search=field('search','standardSearch',false);
      bind(search,'placeholder','searchPlaceholder');
      standardInput=field('selected','standardId',true,[]);
      var resultBlank=null,resultCount=0;
      localeBindings.push(function(){if(resultBlank)resultBlank.textContent=t('results',{count:resultCount});});
      function refreshStandards(){
        var previous=standardInput.value;
        var matches=filterStandards(standards,search.value,50);
        standardInput.replaceChildren();
        var blank=d.createElement('option');blank.value='';resultBlank=blank;resultCount=matches.length;blank.textContent=t('results',{count:resultCount});standardInput.appendChild(blank);
        matches.forEach(function(s){var o=d.createElement('option');o.value=s.standardId;o.textContent=s.name+' ('+s.standardId+')';standardInput.appendChild(o);});
        if(matches.some(function(s){return s.standardId===previous;}))standardInput.value=previous;
      }
      search.addEventListener('input',refreshStandards);
      refreshStandards();
      if(preselectedStandardId){
        if(!standards.some(function(s){return s.standardId===preselectedStandardId;}))
          fail('Selected standard is not in this catalog');
        standardInput.value=preselectedStandardId;
        // Ensure the selected reference remains in the filtered list.
        if(standardInput.value!==preselectedStandardId){
          search.value=preselectedStandardId;
          refreshStandards();standardInput.value=preselectedStandardId;
        }
      }
    }else{
      standardInput=field('standardName','standardName',true);
      var note=d.createElement('small');bind(note,'textContent','manualNote');form.appendChild(note);
    }
    var labelInput=field('blipLabel','label',true);
    var ringInput=field('ring','ring',true,rings.map(function(x){return {value:x,label:x};}));
    var quadrantInput=field('quadrant','quadrant',true,quadrants.map(function(x){return {value:x,label:x};}));
    var description=d.createElement('p');bind(description,'textContent','positionHint');
    description.style.margin='0';description.style.fontSize='12px';form.appendChild(description);
    var error=d.createElement('p');error.setAttribute('role','alert');error.style.color='#a00';error.style.margin='0';form.appendChild(error);
    var actions=d.createElement('div');actions.style.display='flex';actions.style.gap='8px';
    var cancel=d.createElement('button');cancel.type='button';bind(cancel,'textContent','cancel');
    cancel.addEventListener('click',close);actions.appendChild(cancel);
    var save=d.createElement('button');save.type='submit';bind(save,'textContent','create');actions.appendChild(save);form.appendChild(actions);
    overlay.appendChild(form);d.body.appendChild(overlay);
    localeBindings.push(function(){if(lastError)error.textContent=errorMessage(lastError);});
    root.i18next?.on?.('languageChanged',refreshLanguage);
    form.addEventListener('submit',function(event){
      event.preventDefault();
      try{
        if(root.__radarRevisionSession.status().activeGroup!==target.group)fail('Active radar changed: reopen the form');
        var fields={label:labelInput.value,ring:ringInput.value,quadrant:quadrantInput.value};
        fields[kind==='existing'?'standardId':'standardName']=standardInput.value;
        var result=submit(graph,kind,fields);
        close();
        root.console?.info?.('Catalog creation committed',result);
        if(root.w2alert)root.w2alert(t('created',{id:result.blipId}));
      }catch(e){lastError=e;error.textContent=errorMessage(e);}
    });
    cancel.focus();
    return overlay;
  }
  root.__radarCatalogCreateForm=Object.freeze({open:open,submit:submit,errorMessage:errorMessage,initialPosition:initialPosition,filterStandards:filterStandards,geometryOptions:function(){return {rings:rings.slice(),quadrants:quadrants.slice()};}});
})(window);
