import type { IdSigneMeteo } from '../../domain/signes';

/**
 * Phrase d'accroche (§5.6) : une affirmation, jamais une exhortation.
 *
 * Version placeholder — une phrase fixe par signe, sans horizon temporel ni
 * horaire de bascule calculés depuis la frise horaire. La composition
 * complète (« Orage dans les vingt minutes. Grêle possible. », l'heure de
 * bascule plutôt que la condition moyenne) dépend de la frise construite en
 * phase 5 ; à raccorder à ce moment-là (voir DECISIONS.md).
 */
const PHRASES_PLACEHOLDER: Record<IdSigneMeteo, string> = {
  soleil: 'Ciel dégagé pendant la prochaine heure.',
  lune: 'Nuit claire pendant la prochaine heure.',
  voile: 'Ciel voilé pendant la prochaine heure.',
  couvert: 'Ciel couvert pendant la prochaine heure.',
  pluie: 'Pluie pendant la prochaine heure.',
  averse: 'Averses pendant la prochaine heure.',
  orage: 'Orage dans les prochaines minutes.',
  neige: 'Neige pendant la prochaine heure.',
  grele: 'Grêle possible pendant la prochaine heure.',
  brume: 'Brume pendant la prochaine heure.',
  vent: 'Vent soutenu pendant la prochaine heure.',
  rafale: 'Rafales pendant la prochaine heure.',
  canicule: 'Chaleur intense pendant la prochaine heure.',
  gel: 'Gel pendant la prochaine heure.',
  lever: 'Lever de soleil imminent.',
  coucher: 'Coucher de soleil imminent.',
};

export function phrasePlaceholder(signe: IdSigneMeteo): string {
  return PHRASES_PLACEHOLDER[signe];
}
