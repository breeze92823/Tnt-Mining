// Suspends until the Fredoka webfont is usable, so canvas-painted labels
// (utils/labels.js) never bake in a fallback font. Gives up after a few
// seconds so an offline load still renders.
let ready = false
let promise = null

export function useFontsReady() {
  if (ready) return
  if (!promise) {
    const load = Promise.all(['700 64px Fredoka', '600 64px Fredoka'].map((f) => document.fonts.load(f)))
    const timeout = new Promise((resolve) => setTimeout(resolve, 4000))
    promise = Promise.race([load, timeout]).catch(() => {}).then(() => {
      ready = true
    })
  }
  throw promise
}
