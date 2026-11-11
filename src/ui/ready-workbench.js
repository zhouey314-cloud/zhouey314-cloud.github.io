// Only the workbench page loads this graph; inactive panels remain unmounted.
// Re-exports retain their static dependencies without creating another root.
export {RagWorkbench,RelayWorkbench,VideoWorkbench} from './workbench.jsx';
export {hydrate} from './hydrate.jsx';
