<template>
  <AppHeader v-if="!isGameFullscreen" />
  <main class="app-main" :class="{ fullscreen: isGameFullscreen }">
    <GameArea />
  </main>
  <AppFooter v-if="!isGameFullscreen" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from "../components/AppHeader.vue"
import AppFooter from "../components/AppFooter.vue"
import GameArea from "../components/GameArea.vue"

const isGameFullscreen = ref(Boolean(document.fullscreenElement))

function syncFullscreenState() {
  isGameFullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>

<style>
.app-main {
  min-height: calc(100vh - 200px);
  padding: 0;
}

.app-main.fullscreen {
  min-height: 100vh;
}
</style>
