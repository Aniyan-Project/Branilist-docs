import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { locales, searchLocales } from './locales.mts'

const navigation = JSON.parse(readFileSync(new URL('../.site/navigation.json', import.meta.url), 'utf8'))
const base = '/Branilist-docs/'
// Recognize SDL downloads as static assets in both the build and client router.
process.env.VITE_EXTRA_EXTENSIONS = 'graphql'

export default defineConfig({
  lang: 'pt-BR',
  title: 'Branilist API Docs',
  description: 'Guias e referência das APIs públicas REST e GraphQL do Branilist.',
  vite: { define: { 'import.meta.env.VITE_EXTRA_EXTENSIONS': JSON.stringify('graphql') } },
  srcDir: '.site',
  srcExclude: ['navigation.json'],
  base,
  cleanUrls: false,
  appearance: true,
  locales,
  head: [['meta', { name: 'color-scheme', content: 'light dark' }]],
  sitemap: { hostname: 'https://aniyan-project.github.io/Branilist-docs/' },
  themeConfig: {
    siteTitle: 'Branilist API Docs',
    nav: [
      { text: 'Guia', link: '/guide/introduction', activeMatch: '^/(guide/|$)' },
      { text: 'Referência', link: '/reference/', activeMatch: '^/reference/' },
      { text: 'Branilist', link: 'https://branilist.com' }
    ],
    sidebar: {
      '/guide/': navigation.guide,
      '/reference/': navigation.reference,
      '/': navigation.guide
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Aniyan-Project/Branilist-docs' }],
    search: {
      provider: 'local',
      options: {
        locales: searchLocales
      }
    },
    outline: { level: [2, 3], label: 'Nesta página' },
    sidebarMenuLabel: 'Navegação',
    returnToTopLabel: 'Voltar ao início',
    darkModeSwitchLabel: 'Aparência',
    lightModeSwitchTitle: 'Usar tema claro',
    darkModeSwitchTitle: 'Usar tema escuro',
    skipToContentLabel: 'Ir para o conteúdo',
    docFooter: { prev: 'Anterior', next: 'Próxima' },
    editLink: {
      text: 'Editar esta página no GitHub',
      pattern: ({ frontmatter }) => `https://github.com/Aniyan-Project/Branilist-docs/edit/main/${frontmatter.source ?? 'openapi.json'}`
    }
  }
})
