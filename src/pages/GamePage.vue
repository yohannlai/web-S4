<template>
  <AppHeader v-if="!isGameFullscreen" />
  <main class="app-main" :class="{ fullscreen: isGameFullscreen }">
    <GameArea />
  </main>
  <AppFooter v-if="!isGameFullscreen" />
</template>

<script setup>
import AppHeader from "../components/AppHeader.vue"
import AppFooter from "../components/AppFooter.vue"
import GameArea from "../components/GameArea.vue"
import { useFullscreen } from '../composables/useFullscreen'

const { isFullscreen: isGameFullscreen } = useFullscreen()
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
