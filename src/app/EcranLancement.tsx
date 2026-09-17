import { useEffect, useRef, useState } from 'react';
import { Paysage } from '../design/Paysage';
import { Signe } from '../design/Signe';
import { SIGNES_METEO, type IdSigneMeteo } from '../domain/signes';
import { useDonneesPretes } from '../lib/lancement';
import styles from './EcranLancement.module.css';

/**
 * Écran de lancement (§7, post-livraison — demandé) : plein écran, tenu le
 * temps que la prévision de l'accueil arrive, puis relevé par marches.
 *
 * Il ne contredit pas « pas de spinner au démarrage » (§7) : ce que la règle
 * interdit, c'est la roue générique posée sur un écran vide, que iOS
 * photographie ensuite pour le sélecteur d'applications. Ce qui est peint ici
 * est l'application elle-même — le ciel du palier courant, la trame, le
 * paysage du héros — avec la lecture des signes pour seul mouvement. Le
 * palier est posé sur `<html>` avant le premier rendu (`main.tsx`) : l'écran
 * ne peint jamais en `vigies` avant de basculer.
 *
 * Trois temps de sortie, en écho aux trois temps du §7 : le bloc central
 * quitte vers le haut, le paysage s'enfonce, puis l'écran se retire par le
 * bas en `steps(4)` — la couleur avance par marches (§5.2) — avec un fondu
 * sur la fin. Le héros joue son propre mouvement de 600 ms dessous pendant
 * ce temps-là : le retrait le découvre en train de se peindre. Le détail du
 * sens de retrait est justifié dans le module CSS.
 */

/** La lecture du ciel : six signes, six marches de jauge, une seule horloge. */
const SIGNES_LECTURE: readonly IdSigneMeteo[] = [
  'soleil',
  'voile',
  'couvert',
  'pluie',
  'orage',
  'vent',
];

const PAS_MS = 400;
/** Trois signes au moins : sous ce seuil, un cache déjà chaud ne ferait que clignoter. */
const DUREE_MINIMALE_MS = 3 * PAS_MS;
/** Plafond dur : rien ne doit jamais retenir l'utilisateur derrière cet écran (§0, tous les états existent). */
const DUREE_MAXIMALE_MS = 6000;
/** Doit couvrir la plus longue animation de `.sortie` dans le module CSS. */
const DUREE_SORTIE_MS = 460;

/**
 * Seul le lancement sur l'accueil attend une prévision. Un lien profond
 * (/reglages, /lexique, une notification) n'a rien à attendre : l'écran ne
 * s'affiche pas du tout. Lu une seule fois, à l'évaluation du module —
 * c'est-à-dire au lancement, avant toute navigation interne.
 */
const LANCEMENT_SUR_ACCUEIL =
  typeof window !== 'undefined' && window.location.pathname === '/';

const ANNEAU = 120;
const CENTRE = ANNEAU / 2;
const ANGLES_RAYON = [0, 45, 90, 135, 180, 225, 270, 315];
const ANGLES_POINT = ANGLES_RAYON.map((a) => a + 22.5);

function mouvementReduit(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type Phase = 'lecture' | 'sortie' | 'fini';

export function EcranLancement() {
  const donneesPretes = useDonneesPretes();
  const [phase, setPhase] = useState<Phase>(LANCEMENT_SUR_ACCUEIL ? 'lecture' : 'fini');
  const [rang, setRang] = useState(0);
  const debut = useRef(Date.now());
  const [reduit] = useState(mouvementReduit);

  // Cadence de lecture. Figée sur le premier signe en mouvement réduit (§7 :
  // « prefers-reduced-motion: reduce supprime les trois temps ») — un glyphe
  // qui se substitue à un autre reste du mouvement, même sans transition.
  useEffect(() => {
    if (phase !== 'lecture' || reduit) return;
    const intervalle = setInterval(
      () => setRang((precedent) => (precedent + 1) % SIGNES_LECTURE.length),
      PAS_MS,
    );
    return () => clearInterval(intervalle);
  }, [phase, reduit]);

  // Bascule vers la sortie : dès que les données sont là, jamais avant la
  // durée minimale, jamais après le plafond même si rien n'arrive.
  useEffect(() => {
    if (phase !== 'lecture') return;
    const ecoule = Date.now() - debut.current;
    const attenteMinimale = Math.max(0, DUREE_MINIMALE_MS - ecoule);
    const delai = donneesPretes
      ? attenteMinimale
      : Math.max(attenteMinimale, DUREE_MAXIMALE_MS - ecoule);
    const minuteur = setTimeout(() => setPhase('sortie'), delai);
    return () => clearTimeout(minuteur);
  }, [phase, donneesPretes]);

  // Démontage réel une fois la sortie jouée : l'écran ne doit rien laisser
  // derrière lui, ni nœud ni capture d'événement.
  useEffect(() => {
    if (phase !== 'sortie') return;
    const minuteur = setTimeout(() => setPhase('fini'), reduit ? 200 : DUREE_SORTIE_MS);
    return () => clearTimeout(minuteur);
  }, [phase, reduit]);

  if (phase === 'fini') return null;

  const signe = SIGNES_LECTURE[rang] ?? 'soleil';

  return (
    <>
      {/* Le visuel double le héros qui se peint dessous : rien à annoncer deux
          fois aux technologies d'assistance, seule la région vive ci-dessous parle. */}
      <div
        className={phase === 'sortie' ? `${styles.ecran} ${styles.sortie}` : styles.ecran}
        // Prise stable pour `tests/e2e/lancement.spec.ts` : les noms de classe
        // des modules CSS sont hachés au build, ils ne font pas un sélecteur.
        data-ecran-lancement={phase}
        aria-hidden="true"
      >
        <div className={styles.bloc}>
          <div className={styles.disque}>
            <svg className={styles.anneau} viewBox={`0 0 ${ANNEAU} ${ANNEAU}`} aria-hidden="true">
              {/* Deux des quatre primitives du système de signes (§5.4) : la barre
                  et le point. Huit rayons, huit points intercalés — une rotation de
                  45° boucle donc exactement sur elle-même, sans raccord visible. */}
              <g stroke="currentColor" strokeWidth={4} strokeLinecap="square">
                {ANGLES_RAYON.map((angle) => (
                  <line
                    key={angle}
                    x1={CENTRE}
                    y1={CENTRE - 56}
                    x2={CENTRE}
                    y2={CENTRE - 44}
                    transform={`rotate(${angle} ${CENTRE} ${CENTRE})`}
                  />
                ))}
              </g>
              <g fill="currentColor">
                {ANGLES_POINT.map((angle) => (
                  <rect
                    key={angle}
                    x={CENTRE - 2}
                    y={CENTRE - 52}
                    width={4}
                    height={4}
                    transform={`rotate(${angle} ${CENTRE} ${CENTRE})`}
                  />
                ))}
              </g>
            </svg>
            {/* Substitution franche d'un signe à l'autre, jamais un fondu : la
                même règle que la bascule de palier (§5.2, `steps(3)`). */}
            <span className={styles.signe} key={signe}>
              <Signe nom={signe} taille={56} />
            </span>
          </div>

          <p className={styles.marque}>Augure</p>
          <p className={styles.translit}>{SIGNES_METEO[signe].translit}</p>

          <div className={styles.jauge}>
            {SIGNES_LECTURE.map((nom, index) => (
              <span
                key={nom}
                className={index <= rang ? `${styles.marche} ${styles.marcheAtteinte}` : styles.marche}
              />
            ))}
          </div>
        </div>

        <div className={styles.paysage}>
          <Paysage />
        </div>
      </div>
      <p role="status" className={styles.annonce}>
        {phase === 'lecture' ? 'Chargement de la météo' : 'Météo chargée'}
      </p>
    </>
  );
}
