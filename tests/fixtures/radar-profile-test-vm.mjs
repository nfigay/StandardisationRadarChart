import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const profileSource=readFileSync(
  new URL(
    '../../js/radar-application-profile.js',
    import.meta.url
  ),
  'utf8'
);

export function installProfile(sandbox,search=''){
  if(!sandbox?.window){
    throw Error(
      'Profile test environment requires window'
    );
  }

  const root=sandbox.window;

  if(root.__radarApplicationProfile){
    return root.__radarApplicationProfile;
  }

  root.URLSearchParams=URLSearchParams;

  root.location={
    ...(root.location||{}),
    search
  };

  vm.runInNewContext(
    profileSource,
    sandbox,
    {
      filename:'radar-application-profile.js'
    }
  );

  return root.__radarApplicationProfile;
}

function prepare(sandbox){
  if(sandbox?.window){
    installProfile(
      sandbox,
      sandbox.window.location?.search||''
    );
  }

  return sandbox;
}

export function runInNewContext(code,sandbox,options){
  return vm.runInNewContext(
    code,
    prepare(sandbox),
    options
  );
}

export function createContext(sandbox,options){
  return vm.createContext(
    prepare(sandbox),
    options
  );
}

export function runInContext(code,context,options){
  prepare(context);

  return vm.runInContext(
    code,
    context,
    options
  );
}

export class Script extends vm.Script{
  runInNewContext(sandbox,options){
    return super.runInNewContext(
      prepare(sandbox),
      options
    );
  }

  runInContext(context,options){
    prepare(context);

    return super.runInContext(
      context,
      options
    );
  }
}

export * from 'node:vm';

export default {
  ...vm,
  runInNewContext,
  createContext,
  runInContext,
  Script
};
