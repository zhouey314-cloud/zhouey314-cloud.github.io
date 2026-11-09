import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';

// The neutral theme supplies the supported component/icon contracts. Only this
// local theme defines the portfolio palette; no page-wide Astryx reset or font.
export const gardenTheme = defineTheme({
  name: 'enyu-garden',
  extends: neutralTheme,
  typography: {
    scale: {base: 16, ratio: 1.15},
    body: {family: 'Lexend', fallbacks: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'},
    heading: {family: 'Lexend', fallbacks: '"PingFang SC", "Microsoft YaHei", sans-serif'},
  },
  tokens: {
    '--color-background-body': '#eeeee7',
    '--color-background-surface': '#f8f8f1',
    '--color-background-card': '#f8f8f1',
    '--color-background-popover': '#fafbf5',
    '--color-background-muted': '#e5eadc',
    '--color-accent': '#405737',
    '--color-accent-muted': '#dce7c7',
    '--color-on-accent': '#ffffff',
    '--color-text-primary': '#283528',
    '--color-text-secondary': '#58644f',
    '--color-text-accent': '#3b542d',
    '--color-icon-accent': '#405737',
    '--color-border': '#c9d0bf',
    '--color-border-emphasized': '#81936d',
    '--color-text-error': '#9e2429',
    '--radius-element': '12px',
    '--radius-container': '18px',
    '--font-size-base': '16px',
    '--size-element-lg': '48px',
  },
});
