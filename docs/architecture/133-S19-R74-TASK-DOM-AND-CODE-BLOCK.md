# ADR 133 — R74 : structure Tiptap des tâches et commande de bloc de code

## Constats de recette Chrome

Le document ProseMirror réel contient `ul[data-type="taskList"] > li[data-checked] > label + div > p`.
Le précédent sélecteur R7 `li[data-type="taskItem"]` ne correspond pas au DOM rendu ; il laisse la case et le paragraphe sur deux lignes. Le JSON du document, lui, est valide et le HTML de visualisation présente déjà correctement les tâches.

La barre compacte associe `<>` à `inlineCode`, d'où `<p><code>…</code></p>` au lieu de `<pre><code>…</code></pre>`.

## Décision

1. Adapter exclusivement les sélecteurs CSS des tâches du panneau R74 au DOM `li[data-checked]`; conserver `ul[data-type="taskList"]` pour limiter la portée.
2. Placer `codeBlock` sur la barre principale à la place de `inlineCode`; la commande `inlineCode` reste disponible dans le menu avancé.
3. Conserver le modèle Tiptap, le renderer HTML, les dossiers, les références associées et les protections d'iframe/CSP.
4. Ne pas introduire de règle globale sur W2UI ni de modification de la géométrie du radar.

## Vérification

Tests Node.js : câblage de la barre, sélecteurs et styles scopés, préservation des commandes et rendus distincts.
Recette Chrome requise : case/texte sur une ligne, édition après la case et Entrée ; `<>` produit un bloc monospacé ; code en ligne disponible dans le menu `⋯` ; persistance et visualisation après sauvegarde.
