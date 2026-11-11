// Keep the archive's initial module graph in the document's load lifecycle.
// Bootstrap still owns hydration and restores SSR if this graph fails.
export {default as Archive} from './archive.jsx';
export {hydrate} from './hydrate.jsx';
