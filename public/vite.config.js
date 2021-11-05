export default ({ command, mode }) => {
  if (command === 'serve') {
    return {
      // serve specific config
      root: `.`,
      plugins: [],
      publicDir: `../`, // workaround to have access to files in the root directory through the vite dev server
      server: {
        fs: {
          strict: false,
        }
      }
    }
  } else {
    return {
      // build specific config
      plugins: [],
    }
  }
}
