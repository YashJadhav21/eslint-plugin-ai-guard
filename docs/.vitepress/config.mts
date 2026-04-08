import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'eslint-plugin-ai-guard',
  description: 'AST-first ESLint rules for AI-generated code pitfalls',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Rules', link: '/rules' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Rules', link: '/rules' },
        ],
      },
    ],
  },
});
