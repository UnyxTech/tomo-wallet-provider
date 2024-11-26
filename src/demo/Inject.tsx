import { Buffer as BufferPolyfill } from 'buffer'

if (typeof window !== 'undefined') {
  window.Buffer = BufferPolyfill
  // @ts-ignore
  window.process = {
    env: {}
  }
}
