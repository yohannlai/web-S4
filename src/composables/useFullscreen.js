import { onMounted, onUnmounted, ref } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(Boolean(document.fullscreenElement))

  function syncFullscreenState() {
    isFullscreen.value = Boolean(document.fullscreenElement)
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement.requestFullscreen()
    } catch (error) {
      console.error('Impossible de changer le mode plein ecran:', error)
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState)
  })

  return {
    isFullscreen,
    toggleFullscreen
  }
}
