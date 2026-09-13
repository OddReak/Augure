/**
 * Partage d'un lieu (§6, pastille « partage » du chapeau et menu du lieu) :
 * l'API Web Share quand le navigateur l'expose, sinon une copie du lien dans
 * le presse-papiers — jamais un bouton décoratif qui ne fait rien.
 */
export async function partagerLieu(nomLieu: string): Promise<void> {
  const url = window.location.href;
  const donnees = { title: 'AUGURE', text: `La météo à ${nomLieu}`, url };
  try {
    if (navigator.share) {
      await navigator.share(donnees);
      return;
    }
    await navigator.clipboard.writeText(url);
  } catch {
    // L'utilisateur a annulé le partage, ou aucune des deux API n'est disponible :
    // rien à faire de plus, ce n'est pas une erreur à signaler (§5.6, pas d'excuse).
  }
}
