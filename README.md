# Sintercube

Mobile-friendly 3D Rubik's cube built with React, Three.js and react-three-fiber.

Features
- 3D rotatable cube (touch + keyboard)
- Slice rotations, scramble, reset, dev buttons
- Time limit with annoying ticking sound
- Hidden message shown when solved
- Deploys to GitHub Pages

Quick start

Install:

```bash
npm install
npm run dev
```

Build & deploy (after setting your GitHub remote):

```bash
npm run deploy
```

Set default time limit in `.env` via `VITE_TIME_LIMIT_MINUTES` (minutes).
