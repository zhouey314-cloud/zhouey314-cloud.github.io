import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
export const profiles=JSON.parse(readFileSync(resolve(root,'content/page-styles.json'),'utf8'));
export const profileFiles=new Set();
const filters=[{value:'all',label:'全部项目'},{value:'tools',label:'工具与工作流'},{value:'creative',label:'创作实验'},{value:'methods',label:'评估与方法'}];
export function writeOutput(path,text,checking){const file=resolve(root,path);if(checking){if(!existsSync(file)||readFileSync(file,'utf8')!==text)throw Error(path+' is stale. Run npm run build');}else{mkdirSync(dirname(file),{recursive:true});writeFileSync(file,text);}}
export function finalizePage(page,html,ui,checking) {
  if(page==='projects.html')html=html.replace(/<!-- astryx:archive -->[\s\S]*?<!-- \/astryx:archive -->/,'<!-- astryx:archive -->'+ui.island('archive',{filters,count:16})+'<!-- /astryx:archive -->');
  html=html.replace(/<dialog\b[^>]*data-viewer[\s\S]*?<\/dialog>/g,'<div data-ui-lightbox></div>');
  if(!html.includes('data-ui-lightbox')&&page!=='collaborate.html')html=html.replace('</body>','<div data-ui-lightbox></div></body>');
  html=html.replace(/<!-- astryx:assets -->[\s\S]*?<!-- \/astryx:assets -->\s*/g,'');
  const needsComponents=page==='index.html'||/data-ui="(?:archive|cooperate|rag|relay|video)"/.test(html);
  const assets=needsComponents?ui.assets:/\bdata-preview=/.test(html)?ui.lazyAssets:'';
  if(page!=='index.html'){
    const css=profiles[page].map(path=>{
      const text=readFileSync(resolve(root,path),'utf8');
      if(/@import\b|url\(\s*['"]?(?!\/|data:|https?:|#)[^'"\s)]/i.test(text))throw Error('Profile CSS needs root-relative URLs and no imports: '+path);
      return '/* '+path+' */\n'+text;
    }).join('\n');
    const path='public/site/page-'+createHash('sha256').update(css).digest('hex').slice(0,12)+'.css';profileFiles.add(path);writeOutput(path,css,checking);
    html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>\s*/g,'');
    // This owned marker makes repeated builds byte-identical.
    html=html.replace(/<!-- portfolio:styles -->[\s\S]*?<!-- \/portfolio:styles -->\s*/g,'');
    html=html.replace('</head>',`<!-- portfolio:styles --><link rel="stylesheet" href="/${path}" /><!-- /portfolio:styles -->\n${assets}\n</head>`);
  }else html=html.replace('</head>',assets+'\n</head>');
  return html;
}
