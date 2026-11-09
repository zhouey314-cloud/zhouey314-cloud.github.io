import React from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import zhCN from '@astryxdesign/core/locales/zh-CN.generated.js';
import {enyuGardenTheme as gardenTheme} from './generated/enyu-garden.js';

export function Garden({children, className = ''}) {
  return <div className={'garden-ui '+className}><Theme theme={gardenTheme} mode="light"><InternationalizationProvider locale="zh-CN" messages={{'zh-CN':zhCN}}>{children}</InternationalizationProvider></Theme></div>;
}
export function Action({className = '', ...props}) {
  return <Button size="lg" className={'garden-button '+className} data-garden-variant={props.variant||'secondary'} {...props}/>;
}
export function Choice({options, ...props}) {
  return <Selector size="lg" width="100%" presentation="adaptive" options={options}
    renderOption={o => <span data-choice-value={o.value}>{o.label || o.value}</span>}
    {...props}/>;
}
export const useReady = () => {
  const [ready,setReady] = React.useState(false);
  React.useEffect(() => setReady(true),[]);
  return ready;
};
export function download(name, content, type='application/json') {
  const url=URL.createObjectURL(new Blob([content],{type:type+';charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function HeroActions() {
  return <Garden className="hero-actions-astryx"><Action href="#selected-projects" label="看我的作品" className="metal-button" endContent={<span aria-hidden="true">↘</span>}/><Action href="/collaborate.html" label="聊聊合作" variant="ghost" className="hero-cooperate" endContent={<span aria-hidden="true">↗</span>}/></Garden>;
}
