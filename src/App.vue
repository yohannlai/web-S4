<template>
  <AppHeader />

  <main class="app-main">
    <!-- Zone de jeu à venir -->
  </main>

  <AppFooter />
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue"
import AppFooter from "./components/AppFooter.vue"
</script>

<style>
:root {
  /* Couleurs */
  --color-bg: #111111;
  --color-bg-soft: #141414;
  --color-text: #F2F2F2;
  --color-text-muted: #9A9A9A;
  --color-accent: #D6B25E;

  /* Typographies */
  --font-ui: "Inter", system-ui, sans-serif;
  --font-logo: "Playfair Display", serif;
}

body {
  margin: 0;
  font-family: var(--font-ui);
}

.app-main {
  min-height: calc(100vh - 200px);
  padding: 3rem;
}
</style>
