<template>
  <AppHeader />
  <main class="app-main">
    <GameArea />
  </main>
  <AppFooter />
</template>

<script setup>
import AppHeader from "../components/AppHeader.vue"
import AppFooter from "../components/AppFooter.vue"
import GameArea from "../components/GameArea.vue"
</script>

<style>
.app-main {
  min-height: calc(100vh - 200px);
  padding: 0;
}
</style>
