<template>
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <h1 class="logo"><a href="">Cinélogique</a></h1>
        <p class="tagline">Un film. Des indices. À toi de trouver.</p>
      </div>

      <nav class="actions">
        <button class="btn-theme" @click="toggleTheme" :title="isDark ? 'Mode clair' : 'Mode sombre'">
          <span v-if="isDark">☀️</span>
          <span v-else>🌙</span>
        </button>

        <button class="btn btn-secondary" @click="openRules">Règles</button>
        <button class="btn btn-primary" @click="reloadPage">Nouvelle partie</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  isDark.value = savedTheme === 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
})

function reloadPage() {
  window.dispatchEvent(new CustomEvent("cine:new-game"))
}

function openRules() {
  window.dispatchEvent(new CustomEvent("cine:open-rules"))
}
</script>

<style scoped>
.app-header {
  background-color: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
  transition: background-color 0.3s ease;
}

.header-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo, a {
  text-decoration-line: none;
  font-family: "Playfair Display", serif;
  font-style: italic;
  font-weight: 700;
  font-size: 2.5rem;
  margin: 0;
  color: var(--text-main);
  line-height: 1;
}

.tagline {
  font-family: "Outfit", sans-serif;
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}

.actions { display: flex; gap: 1rem; align-items: center; }

/* Bouton Thème */
.btn-theme {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-theme:hover { transform: scale(1.1); }

.btn {
  font-family: "Outfit", sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.6rem 1.2rem;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-main);
}

.btn-secondary:hover,
.btn-secondary:focus-visible {
  transform: translateY(-2px);
  border-color: #94a3b8;
  background: color-mix(in srgb, var(--bg-hidden) 55%, var(--bg-card));
}

.btn-primary {
  background: #10b981;
  border: 2px solid #10b981;
  color: #ffffff;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-2px);
}
</style>
