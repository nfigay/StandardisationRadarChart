/* S14.3-A8.1
 * Common application profile.
 * Transitional synchronous bootstrap for legacy scripts.
 * A profile is not an authentication mechanism.
 */
(function(root){
  'use strict';

  const CAPABILITIES=Object.freeze([
    'catalog.open',
    'catalog.create',
    'catalog.export',
    'catalog.admin',
    'catalog.declareReference',
    'radar.navigate',
    'radar.consult',
    'radar.edit',
    'radar.createBlip',
    'radar.rename',
    'revision.create',
    'revision.publish',
    'workspace.remove',
    'workspace.loadLegacy',
    'graph.import',
    'graph.export',
    'publication.create'
  ]);

  const viewerCapabilities=new Set([
    'catalog.open',
    'radar.navigate',
    'radar.consult'
  ]);

  const params=new root.URLSearchParams(
    root.location?.search||''
  );

  const requested=params.getAll('profile');

  const valid=requested.length===0 ||
    (requested.length===1 &&
      ['creator','viewer'].includes(requested[0]));

  const name=valid &&
    (requested.length===0 ||
      requested[0]==='creator')
    ?'creator'
    :'viewer';

  const viewer=name==='viewer';

  const enabled=new Set(
    !valid?[]:
    viewer?[...viewerCapabilities]:
    CAPABILITIES
  );

  function allows(capability){
    return enabled.has(capability);
  }

  function requireCapability(capability){
    if(!allows(capability)){
      const error=new Error(
        'Application capability denied: '+capability
      );

      error.code='CAPABILITY_DENIED';
      error.capability=capability;

      throw error;
    }
    return true;
  }

  const viewerMenuActions=new Map([
    ['files:loadcatalogjson','catalog.open'],
    ['radartools:selectcatalogrevision','radar.navigate'],
    ['language:fr','radar.consult'],
    ['language:en','radar.consult']
  ]);

  function allowsMenu(action){
    if(!viewer)return true;

    if(viewerMenuActions.has(action)){
      return allows(viewerMenuActions.get(action));
    }

    return [...viewerMenuActions].some(
      ([id,capability])=>
        id.startsWith(action+':') &&
        allows(capability)
    );
  }

  function allowsToolbar(action){
    if(!viewer)return true;

    if(action==='loadcatalogjson')
      return allows('catalog.open');

    if(action==='item2' ||
       action.startsWith('item2:'))
      return allows('radar.navigate');

    return false;
  }

  function filterMainMenu(items){
    if(!viewer)return items;

    return items.flatMap(item=>{
      if(!item.id || !allowsMenu(item.id))
        return [];

      const children=(item.items||[]).filter(
        child=>child.id &&
          allowsMenu(item.id+':'+child.id)
      );

      if(!children.length)return [];

      return [{
        ...item,
        items:children
      }];
    });
  }

  function filterToolbar(items){
    if(!viewer)return items;

    return items.filter(
      item=>item.id==='item2' &&
        allows('radar.navigate')
    );
  }

  function assertCatalog(catalog){
    requireCapability('catalog.open');

    if(!viewer)return true;

    if(!catalog ||
       catalog.schemaVersion!=='1.0.0' ||
       !Array.isArray(catalog.radarRevisions) ||
       !catalog.radarRevisions.length){
      throw Error(
        'Viewer requires a native published catalog'
      );
    }

    if(catalog.radarRevisions.some(
      revision=>revision?.status!=='published'
    )){
      throw Error(
        'Viewer requires published revisions only'
      );
    }

    return true;
  }

  function assertRevision(revision){
    if(viewer){
      requireCapability('radar.navigate');

      if(!revision ||
         revision.status!=='published'){
        throw Error(
          'Viewer requires a published revision'
        );
      }
    }

    return true;
  }

  function readonlyFields(fields){
    for(const field of Object.values(fields||{})){
      if(!field ||
         typeof field!=='object')continue;

      if(field.fields){
        readonlyFields(field.fields);
      }else{
        field.disabled=true;
      }
    }

    return fields;
  }

  const api=Object.freeze({
    name,
    viewer,
    valid,
    capabilities:Object.freeze([...enabled]),
    allows,
    require:requireCapability,
    allowsMenu,
    allowsToolbar,
    filterMainMenu,
    filterToolbar,
    assertCatalog,
    assertRevision,
    readonlyFields
  });

  Object.defineProperty(
    root,
    '__radarApplicationProfile',
    {
      value:api,
      writable:false,
      configurable:false
    }
  );
})(window);
