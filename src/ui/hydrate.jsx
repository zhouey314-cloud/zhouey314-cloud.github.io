import React from 'react';
import {hydrateRoot} from 'react-dom/client';
export function hydrate(root,Component,props,onError) {
  let failed=false;
  const mounted=hydrateRoot(root,<Component {...props}/>,{
    identifierPrefix:root.dataset.uiId+'-',
    onRecoverableError:error=>console.error('Portfolio hydration recovered:',error),
    onUncaughtError(error,info) {
      if(failed)return;failed=true;
      // React reports this after removing the failed tree. Leave its commit
      // before unmounting and restoring the original server-rendered fallback.
      queueMicrotask(()=>{try{mounted.unmount();}finally{onError(error,info);}});
    },
  });
}
