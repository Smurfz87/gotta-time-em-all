import adapter from '@sveltejs/adapter-static'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default {
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html',
      strict: false
    }),
    files: {
      assets: 'public'
    },
    paths: {
      base: repo ? `/${repo}` : ''
    }
  }
}
