import type { IdSigneMeteo } from './signes';

/**
 * Fiches du Lexique (§6, `ficheSigne()`) : description et seuils de
 * déclenchement de chacun des seize signes météo. Le texte d'« orage » est
 * repris tel quel du mockup (`design/mockup.html`, seul signe pour lequel le
 * document maître fournit une fiche rédigée) ; les quinze autres sont
 * rédigés ici à partir de la logique réellement implémentée
 * (`domain/symboles.ts`, `domain/quantification.ts`, §5.2) — jamais des
 * seuils inventés sans rapport avec le code qui décide effectivement du
 * signe ou du palier.
 */
export interface FicheSigne {
  description: string;
  seuils: [label: string, valeur: string][];
}

export const FICHES_SIGNES: Record<IdSigneMeteo, FicheSigne> = {
  soleil: {
    description: 'Ciel dégagé ou quasi dégagé, de jour, sans aucune précipitation.',
    seuils: [
      ['Nébulosité Foreca', '0 ou 1'],
      ['Palier associé', 'Vigies (sauf seuil de température, §5.2)'],
    ],
  },
  lune: {
    description: 'La même condition dégagée, mais de nuit — le préfixe du symbole Foreca l’indique directement.',
    seuils: [
      ['Préfixe du symbole', 'n'],
      ['Palier associé', 'Veille (sauf alerte ou seuil de température)'],
    ],
  },
  voile: {
    description: 'Nébulosité fragmentée ou voile d’altitude, sans précipitation — composé du soleil et du couvert.',
    seuils: [
      ['Nébulosité Foreca', '1, 2 ou 5'],
      ['Palier associé', 'Vigies'],
    ],
  },
  couvert: {
    description: 'Ciel couvert ou fragmenté dense, sans précipitation.',
    seuils: [
      ['Nébulosité Foreca', '3 ou 4'],
      ['Palier associé', 'Vigies'],
    ],
  },
  pluie: {
    description: 'Précipitation de pluie, faible ou continue — pas d’éclaircie entre les averses.',
    seuils: [
      ['Taux de précipitation', 'faible (1) ou continu (3)'],
      ['Type de précipitation', 'pluie (0)'],
      ['Palier associé', 'Ondée'],
    ],
  },
  averse: {
    description: 'Précipitation de pluie par averses, entrecoupée d’éclaircies — composé du soleil et de la pluie.',
    seuils: [
      ['Taux de précipitation', 'averses (2)'],
      ['Palier associé', 'Ondée'],
    ],
  },
  orage: {
    description:
      'La barre-nuage porte l’éclair. Le signe apparaît dès qu’une activité électrique est détectée ou prévue dans l’heure, que la pluie tombe ou non.',
    seuils: [
      ['Activité électrique', 'détectée'],
      ['Rafales associées', '≥ 60 km/h'],
      ['Palier déclenché', 'Colère'],
      ['Grêle possible si', '≥ 35 dBZ'],
    ],
  },
  neige: {
    description: 'Précipitation de neige, quelle que soit son intensité.',
    seuils: [
      ['Type de précipitation', 'neige (2)'],
      ['Palier associé', 'Cendre'],
    ],
  },
  grele: {
    description:
      'Mélange neige/pluie, grésil ou verglas — repris du type « mélange » de Foreca, faute de glyphe dédié (composé de la neige et de la pluie).',
    seuils: [
      ['Type de précipitation', 'mélange (1)'],
      ['Palier associé', 'Colère, comme l’orage'],
    ],
  },
  brume: {
    description: 'Brouillard ou visibilité fortement réduite.',
    seuils: [
      ['Nébulosité Foreca', '6 (brouillard)'],
      ['Palier associé', 'Cendre'],
    ],
  },
  vent: {
    description: 'Glyphe de la métrique « vent » de la frise horaire (§5.2) — jamais une condition du moment décodée depuis Foreca.',
    seuils: [
      ['Origine', 'glyphe de métrique, pas un symbole de condition'],
      ['Bandes affichées', 'calme · modéré · soutenu · fort · tempête'],
    ],
  },
  rafale: {
    description:
      'Réservé à un vent en rafales marquées. Foreca documente un champ de rafale (`windGust`) que l’application ne consomme pas encore.',
    seuils: [
      ['Champ Foreca correspondant', 'windGust, non câblé (voir JOURNAL.md)'],
      ['Utilisation actuelle', 'aucune'],
    ],
  },
  canicule: {
    description: 'Remplace le signe de la condition du moment au-delà d’un seuil de chaleur (§8, vignette de Mes lieux).',
    seuils: [
      ['Seuil de température', '≥ 34 °C'],
      ['Palier associé', 'Fournaise'],
    ],
  },
  gel: {
    description:
      'Remplace le signe de la condition du moment sous le point de congélation (§8) — composé de la neige et de la nuit.',
    seuils: [
      ['Seuil de température', '≤ 0 °C'],
      ['Palier associé', 'Dépend de la condition — le gel n’est pas lui-même un palier'],
    ],
  },
  lever: {
    description: 'Repère posé sur la frise horaire à l’heure exacte du lever du soleil.',
    seuils: [
      ['Calcul', 'éphéméride de Meeus, précision la minute'],
      ['Position', 'jalon inséré dans la frise horaire, jamais une donnée Foreca'],
    ],
  },
  coucher: {
    description: 'Repère posé sur la frise horaire à l’heure exacte du coucher du soleil.',
    seuils: [
      ['Calcul', 'éphéméride de Meeus, précision la minute'],
      ['Position', 'jalon inséré dans la frise horaire, jamais une donnée Foreca'],
    ],
  },
};
