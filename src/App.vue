<template>
  <AppHeader />
  <main class="app-main">
    <GameArea />
  </main>
  <AppFooter />
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue"
import AppFooter from "./components/AppFooter.vue"
import GameArea from "./components/GameArea.vue"
</script>

<style>
/* --- CONFIGURATION DES THÈMES --- */
:root {
  /* MODE CLAIR */
  --bg-page: #f8fafc;
  --bg-header: #ffffff;
  --bg-card: #ffffff;
  --bg-hidden: #f1f5f9;

  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-hidden: #94a3b8;

  --border-color: #e2e8f0;
  --border-dashed: #cbd5e1;
}

[data-theme="dark"] {
  /* MODE SOMBRE */
  --bg-page: #020617;
  --bg-header: #0f172a;
  --bg-card: #1e293b;
  --bg-hidden: #0f172a;

  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --text-hidden: #475569;

  --border-color: #334155;
  --border-dashed: #334155;
}

body {
  margin: 0;
  background-color: var(--bg-page);
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app-main {
  min-height: calc(100vh - 200px);
  padding: 0;
}
</style>
