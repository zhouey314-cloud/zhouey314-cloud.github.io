import React from 'react';
import {hydrateRoot} from 'react-dom/client';
export function hydrate(root,Component,props) {
  hydrateRoot(root,<Component {...props}/>,{identifierPrefix:root.dataset.uiId+'-',onRecoverableError:error=>console.error('Portfolio hydration recovered:',error)});
}
