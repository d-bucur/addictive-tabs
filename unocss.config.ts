import { defineConfig } from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({ dark: 'media' }),
    presetAttributify(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
  ],
})
