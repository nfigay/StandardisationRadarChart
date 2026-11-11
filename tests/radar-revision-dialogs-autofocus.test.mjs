import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../js/radar-revision-dialogs.js', import.meta.url), 'utf8');

test('revision picker disables w2form autofocus during hidden-dialog render', () => {
  let options;
  let renderCalled = false;
  class Form {
    constructor(o) { options = o; this.record=o.record; }
    render() { renderCalled=true; if (options.focus !== -1) throw new TypeError("Cannot read properties of undefined (reading 'offsetParent')"); }
    destroy() {}
  }
  function element(tag) {
    return { tag, id:null, style:{}, children:[], appendChild(c){this.children.push(c);}, setAttribute(){}, addEventListener(){}, remove(){}, showModal(){this.open=true;}, close(){this.open=false;}, textContent:''};
  }
  const root={
    document:{createElement:element,
      getElementById(id){
        return id==='radar-revision-picker-w2form'
          ?element('div'):null;
      },
      body:element('body')},
    w2popup:{
      open(config){
        root.__pickerOpened=true;
        const event={onComplete:null};
        config.onOpen(event);
        event.onComplete?.();
      },
      close(){}
    },
    w2form:Form,
    i18next:{language:'fr'},
    __radarRevisionSession:{status:()=>({activeGroup:'g1'})}
  };
  runInNewContext(source,{window:root});
  const result = root.__radarRevisionDialogs.openPicker(['g1'],()=>{},()=>({status:'draft',version:'0.1.0'}));
  assert.equal(renderCalled,true);
  assert.equal(options.focus,-1);
  assert.equal(root.__pickerOpened,true);
});

test('translation and business labels unaffected',()=>{
  const root={i18next:{language:'en'}};
  runInNewContext(source,{window:root});
  assert.equal(root.__radarRevisionDialogs.t('select'),'Select revision');
  assert.equal(root.__radarRevisionDialogs.label({status:'draft',version:'0.1.0'},0),'r1 — 0.1.0 — Draft');
});
