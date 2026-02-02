<template>
  <header class="app-header">
    <div class="title-block">
      <h1 class="logo">Cinélogique</h1>
      <p class="tagline">Un film. Des indices. À toi de trouver.</p>
    </div>

    <nav class="actions">
      <button class="ghost">Nouvelle partie</button>
      <button class="ghost">Règles</button>
    </nav>
  </header>
</template>

<script setup>
</script>

<style scoped>
.app-header {
  background-color: var(--color-bg-soft);
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(214, 178, 94, 0.2);
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.logo {
  font-family: var(--font-logo);
  font-style: italic;
  font-weight: 900;
  font-size: 2rem;
  letter-spacing: 0.05em;
  margin: 0;
  color: var(--color-text);
}

.logo:hover {
  color: var(--color-accent);
}

.tagline {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
}

.actions {
  display: flex;
  gap: 1rem;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(214, 178, 94, 0.4);
  color: var(--color-text);
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
