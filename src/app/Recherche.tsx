import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adapterLieux } from '../api/foreca';
import type { ForecaReponseRecherche } from '../api/foreca-types';
import { Signe } from '../design/Signe';
import type { Lieu } from '../domain/types';
import { ResultatRecherche } from '../features/lieux/ResultatRecherche';
import { useMagasinUi } from '../lib/magasin';
import { Etiquette } from '../ui/Etiquette';
import styles from './Recherche.module.css';

const DELAI_DEBOUNCE_MS = 300;

/** Recherche de ville (§6, `ecranRecherche()` / `rechercheVide()`). */
export function Recherche() {
  const navigate = useNavigate();
  const ajouterLieu = useMagasinUi((etat) => etat.ajouterLieu);
  const definirLieuActif = useMagasinUi((etat) => etat.definirLieuActif);
  const [terme, setTerme] = useState('');
  const [termeDifferee, setTermeDifferee] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setTermeDifferee(terme.trim()), DELAI_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [terme]);

  const resultats = useQuery({
    queryKey: ['recherche-lieux', termeDifferee],
    queryFn: async () => {
      const reponse = await fetch(`/api/places?q=${encodeURIComponent(termeDifferee)}`);
      if (!reponse.ok) throw new Error(`Échec de /api/places (${reponse.status})`);
      const corps = (await reponse.json()) as ForecaReponseRecherche;
      return adapterLieux(corps);
    },
    enabled: termeDifferee.length > 0,
  });

  function choisir(lieu: Lieu): void {
    ajouterLieu(lieu);
    definirLieuActif(lieu);
    void navigate('/mes-lieux', { viewTransition: true });
  }

  return (
    <main>
      <div className={styles.zone}>
        <div className={styles.champ}>
          <Signe nom="loupe" />
          <input
            value={terme}
            onChange={(e) => setTerme(e.target.value)}
            aria-label="Rechercher une ville"
            autoFocus
          />
        </div>
        {/* §11, post-livraison : Recherche n'est atteinte que depuis Mes lieux — équivalent à
            `navigate(-1)`, qui n'accepte pas `viewTransition` (React Router ne le supporte que
            sur les navigations push/replace). `replace` reproduit la même pile qu'un vrai retour. */}
        <button
          type="button"
          className={styles.lien}
          onClick={() => void navigate('/mes-lieux', { replace: true, viewTransition: true })}
        >
          Annuler
        </button>
      </div>
      {termeDifferee && resultats.data && resultats.data.length === 0 ? (
        <section>
          <div className={styles.vide}>
            <Signe nom="loupe" />
            <h4>Aucun lieu ne correspond</h4>
            <p>Vérifiez l&rsquo;orthographe, ou cherchez la commune la plus proche.</p>
          </div>
        </section>
      ) : null}
      {resultats.data && resultats.data.length > 0 ? (
        <section>
          <Etiquette
            glyphe={<Signe nom="loupe" taille={17} />}
            titre="Résultats"
            note={String(resultats.data.length)}
          />
          <div className={styles.resultats}>
            {resultats.data.map((lieu) => (
              <ResultatRecherche key={`${lieu.coordonnees.latitude},${lieu.coordonnees.longitude}`} lieu={lieu} onChoisir={() => choisir(lieu)} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
