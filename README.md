# web-S4

Interactive movie guessing game built with Vue 3 and Vite. Discover films, collect movies, and challenge yourself with competitive game modes.

**Features:**
- 🎮 Multiple game modes (Classic, Competitive, Timed Challenges)
- 🔍 Movie explorer with advanced filters (genre, country, decade)
- 📚 Personal collection management (Found, Seen, Watchlist)
- ♿ Full accessibility support (WCAG 2.1, keyboard navigation)
- 🌙 Dark/Light theme toggle
- 📱 Responsive design (mobile to desktop)

---

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **TMDB API Key** (free account at [themoviedb.org](https://www.themoviedb.org/settings/api))

---

## Installation & Setup

### 1. Clone or pull the repository

```sh
git clone <https://github.com/yohannlai/web-S4>
cd web-S4
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure TMDB API Key

Create a `.env` file from the example:

```sh
cp .env.example .env
```

Then edit `.env` and add your TMDB API key:

```
VITE_TMDB_API_KEY=your_api_key_here
```

Get your free API key: https://www.themoviedb.org/settings/api

### 4. Start development server

```sh
npm run dev
```

The app will open at `http://localhost:5173` with hot module reloading (HMR).

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint and auto-fix |
| `npm run format` | Format code with Prettier |

---

## Project Structure

```
src/
├── components/        # Reusable Vue components
├── pages/            # Page-level components (routed)
├── services/         # Business logic (API, collection, game scoring)
├── composables/      # Reusable composition API logic
├── utils/            # Helper functions
├── App.vue           # Root component
├── main.js           # App entry point
└── router.js         # Vue Router configuration
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed).

**Recommended Extensions:**
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

Automatic recommendations in VS Code: `.vscode/extensions.json`

---

## Recommended Browser Setup

- **Chrome/Edge/Brave:**
  - [Vue.js DevTools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - Enable Custom Object Formatter: DevTools → Settings → Custom object formatters
  
- **Firefox:**
  - [Vue.js DevTools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

## Troubleshooting

### API requests failing (404, "Invalid API key")
- ✅ Verify `.env` exists and contains valid `VITE_TMDB_API_KEY`
- ✅ Dev server running? Restart with `npm run dev`

### Port 5173 already in use
```sh
# Use a different port
npm run dev -- --port 3000
```

### Build errors
```sh
npm run lint        # Check for ESLint errors
npm run format      # Fix formatting issues
rm -rf node_modules dist  # Clean install
npm install && npm run build
```

---

## Configuration

See [Vite Configuration Reference](https://vite.dev/config/).

**Code Style:**
- EditorConfig: `.editorconfig`
- Prettier: `.prettierrc.json`
- ESLint: `eslint.config.js`
