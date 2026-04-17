<template>
  <footer class="app-footer">
    <div class="footer-content">
      <p class="copyright">© 2026 Cinélogique · Yohann LAI · Projet étudiant IMAC</p>
      <p class="api-credit">Données fournies par l’API TMDB</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: var(--bg-header);
  border-top: 1px solid var(--border-color);
  padding: 2rem 2rem;
  margin-top: auto;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.footer-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  font-family: "Outfit", sans-serif;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.copyright {
  font-weight: 600;
  margin: 0;
}

.api-credit {
  font-style: italic;
  margin: 0;
}
</style>
