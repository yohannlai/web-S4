<template>
  <footer class="app-footer">
    <p>Projet étudiant – IMAC · 2026</p>
    <p class="api">Données fournies par l’API TMDB ?</p>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: var(--color-bg-soft);
  padding: 1rem 3rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(214, 178, 94, 0.15);
}

.api {
  font-style: italic;
}
</style>
