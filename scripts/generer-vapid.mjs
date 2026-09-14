// Génère une paire de clés VAPID (§3, §10 : Web Push standard, pas Firebase)
// au format attendu par la spec (point EC non compressé pour la clé
// publique, scalaire brut pour la clé privée, l'un et l'autre en base64url).
// `crypto.createECDH` expose directement ce format brut — pas besoin de la
// bibliothèque `web-push` seulement pour générer une paire de clés.
//
// Usage : node scripts/generer-vapid.mjs
// N'écrit rien sur disque : recopie la sortie dans `.env` (jamais commité,
// voir .gitignore) — `VITE_VAPID_PUBLIC` et `VAPID_PRIVATE`.

import { createECDH } from 'node:crypto';

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ecdh = createECDH('prime256v1');
ecdh.generateKeys();

console.log('VITE_VAPID_PUBLIC=' + base64Url(ecdh.getPublicKey()));
console.log('VAPID_PRIVATE=' + base64Url(ecdh.getPrivateKey()));
