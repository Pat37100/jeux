# Suites de tests — En Jeux

Patrimoine qualité de l'application (jsdom). **404 assertions, 0 échec** à la v31.

## Lancer
```bash
npm install jsdom
node tests/drive.mjs        # une suite
for t in tests/*.mjs; do node "$t"; done   # tout
```

## Suites principales (23)
- `drive/chrono/pal/avat/micro` : cœur des 3 jeux, palmarès, avatars
- `v8–v31` : une suite par lot de fonctionnalités (non-régression cumulative)
- `clickfinal.mjs` : audit clic — ~228 boutons réellement cliqués sur ~20 écrans
- `buttons.mjs` / `effects.mjs` : analyse statique des handlers / effets visibles

## Règles de la méthode
1. Toujours EXÉCUTER les tests, jamais supposer.
2. Après chaque modification : suite dédiée + non-régression complète + audit clic.
3. Un échec = vérifier si vrai bug ou test obsolète AVANT de conclure.
4. Bump `APP_VERSION` (index.html) ET cache (sw.js) ensemble à chaque déploiement.
5. Vérifier le déploiement via l'API GitHub contents (raw.githubusercontent a un cache CDN).
