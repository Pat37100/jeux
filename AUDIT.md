# 🔍 Référentiel d'audit — En Jeux

**Ce fichier existe parce qu'un audit improvisé par l'esprit qui a les angles morts
ne peut pas trouver ses propres angles morts.** Il est le référentiel extérieur.

> **Quand Patrick dit « audit », il demande TOUT ce qui suit.** Il ne devrait jamais
> avoir à préciser « avec tous les rôles » ou « tous les types » : c'est le défaut.

---

## Les 2 règles qui priment sur tout

**RÈGLE 1 — Un audit qui ne trouve rien est un audit raté, pas une app parfaite.**
Si un angle ne remonte aucun défaut, l'instrument était probablement inadapté.
Changer d'instrument avant de conclure.

**RÈGLE 2 — Toute alerte se vérifie sur le terrain AVANT correction.**
Historique réel : sur un audit, 3 alertes sur 8 étaient fausses, et une suppression
faite sur la foi d'un script (`mcard`, utilisée via `.map`) a cassé la liste des parties.
Vérifier, puis corriger. Jamais l'inverse.

---

## Pourquoi « tous les rôles » avait échoué

Les rôles avaient été traités comme des **étiquettes** : mêmes tests lancés, résultats
répartis sous des titres différents. Un rôle ne produit des découvertes que s'il apporte
**un instrument différent et des données d'entrée différentes**.

D'où la règle : **un rôle sans instrument est un titre décoratif.**

---

## La grille : 11 angles × rôle × instrument

| # | Angle | Rôle | Instrument concret (pas une intention) | Trouvé en vrai |
|---|-------|------|----------------------------------------|----------------|
| 1 | Conformité | QA | Rejouer les suites `tests/*.mjs` + audit clic | régressions |
| 2 | Découverte | Testeur terrain | Simuler des situations de soirée : se tromper, être interrompu, quelqu'un part | **correction de manche impossible** |
| 3 | Sécurité | Ingénieur sécu | **Injecter** `<img onerror>` dans les noms, parcourir tous les écrans | RAS (échappement bon) |
| 4 | Migration | Dev données | **Restaurer** une sauvegarde d'une version ancienne | RAS |
| 5 | Charge | Perf | **Générer 300 manches**, chronométrer chaque rendu | RAS (172 ms) |
| 6 | Valeurs extrêmes | QA | Saisir 999999999, négatifs, virgules, texte, vide | RAS |
| 7 | Compatibilité | Mobile | Mode sombre, encoche, petits écrans, paysage | **mode sombre absent** |
| 8 | Heuristique UX | UX designer | Dérouler **les 10 principes de Nielsen** un par un | **restauration sans garde-fou** |
| 9 | Éditorial | Rédacteur | Extraire tout le texte visible, chercher doublons de sens, tu/vous | RAS (délibéré) |
| 10 | Juridique | Legal | Marques tierces, allégations, RGPD, règles App Store | allégations retirées |
| 11 | Qualité de code | Dev | Fonctions mortes, duplication, poids | 5 fonctions mortes |

### Rôles complémentaires, avec leur instrument propre

| Rôle | Sa question unique | Instrument |
|------|--------------------|-----------|
| **Produit** | Un écran peut-il être un cul-de-sac ? | Ouvrir chaque écran avec des données VIDES |
| **Support** | L'utilisateur peut-il se dépanner seul ? | Chercher version, sauvegarde, message d'erreur actionnable |
| **Designer** | Le système visuel est-il cohérent ? | Compter rayons, tailles de police, couleurs |
| **Marketing** | Comprend-on la promesse en 3 secondes ? | Lire le seul écran d'accueil, sans contexte |
| **Accessibilité** | Utilisable en VoiceOver / plein soleil ? | Compter aria-label, mesurer les contrastes |
| **Nouvel utilisateur** | Où décroche-t-il ? | Parcours complet depuis un stockage vierge |

---

## Instruments — commandes réelles

```bash
# 1. Conformité
for t in tests/*.mjs; do node "$t"; done
node tests/clickfinal.mjs

# 2-11. Les audits par angle (scripts jsdom ad hoc, cf. historique)
#   sécurité   : injecter des noms hostiles puis parcourir tous les écrans
#   migration  : booter avec une sauvegarde ancienne en localStorage
#   charge     : boucle de 300 saveRound() + mesure des temps de rendu
#   extrêmes   : saveRound avec valeurs aberrantes
#   compat     : grep prefers-color-scheme / safe-area / theme-color
#   heuristique: parcourir les 10 principes de Nielsen contre l'app
#   éditorial  : extraire le texte visible, comparer les termes
#   code       : lister les fonctions déclarées vs réellement référencées
```

⚠️ **Piège connu** : une fonction passée en référence (`list.map(mcard)`) n'apparaît pas
comme un appel `mcard(`. Toujours compter les occurrences du **nom**, pas des appels.

---

## Après chaque modification — non négociable

1. `node --check` sur le JS extrait
2. Suite dédiée à la nouveauté + **toutes** les suites existantes
3. Audit clic complet
4. Bump `APP_VERSION` (index.html) **ET** cache (sw.js) — synchronisés
5. Vérifier le déploiement via **l'API GitHub contents** (raw a un cache CDN)

## Ce qu'un audit ne peut PAS remplacer

Le rendu pixel, le son réel, l'ergonomie d'une vraie soirée. Ces trois-là exigent
un iPhone et des joueurs. Ne jamais présenter un audit vert comme une validation terrain.
