import config from '../.vitepress/config'

export default {
  watch: ['./•.md'],
  load: () => {
    return config.themeConfig.sidebar.find(item => item.link === '/installation/index').items
  }
}