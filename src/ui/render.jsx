import React from 'react';
import {renderToString} from 'react-dom/server';
import Archive from './archive.jsx';
import Cooperate from './cooperate.jsx';
import {RagWorkbench,RelayWorkbench,VideoWorkbench} from './workbench.jsx';
import {HeroActions} from './shared.jsx';
const components={archive:Archive,cooperate:Cooperate,rag:RagWorkbench,relay:RelayWorkbench,video:VideoWorkbench};
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
export function island(name,props={}){
  const id='ui-'+name,Component=components[name];
  return `<div data-ui="${name}" data-ui-id="${id}">${renderToString(<Component {...props}/>,{identifierPrefix:id+'-'})}</div><script type="application/json" data-ui-props="${id}">${json(props)}</script>`;
}
export const heroActions=()=>renderToString(<HeroActions/>,{identifierPrefix:'hero-actions-'});
