import { describe, expect, it } from 'vitest';
import {
  ECH_AIR,
  ECH_PLUIE,
  ECH_UV,
  ECH_VENT,
  IDS_METRIQUES,
  METRIQUES,
  bandeTemperature,
  niveau,
  plafondAxeColonnes,
} from '../../src/domain/quantification';

describe('bande de température (§5.2)', () => {
  it('les cinq bandes suivent les seuils exacts du document maître', () => {
    expect(bandeTemperature(5)).toBe('t1');
    expect(bandeTemperature(6)).toBe('t2');
    expect(bandeTemperature(13)).toBe('t2');
    expect(bandeTemperature(14)).toBe('t3');
    expect(bandeTemperature(21)).toBe('t3');
    expect(bandeTemperature(22)).toBe('t4');
    expect(bandeTemperature(29)).toBe('t4');
    expect(bandeTemperature(30)).toBe('t5');
    expect(bandeTemperature(-3)).toBe('t1');
  });
});

describe('échelles par colonnes (§5.2) — valeurs recopiées du mockup', () => {
  it('ECH_UV suit le barème OMS à cinq bandes', () => {
    expect(ECH_UV).toHaveLength(5);
    expect(niveau(0, ECH_UV)).toEqual({ seuil: 2, couleur: '#5C9E6E', libelle: 'faible' });
    expect(niveau(2, ECH_UV).libelle).toBe('faible');
    expect(niveau(2.1, ECH_UV).libelle).toBe('modéré');
    expect(niveau(11, ECH_UV)).toEqual({ seuil: 99, couleur: '#8E3A9E', libelle: 'extrême' });
  });

  it('ECH_AIR suit le barème EAQI à six bandes, la seule métrique qui n\'en compte pas cinq', () => {
    expect(ECH_AIR).toHaveLength(6);
    expect(niveau(1, ECH_AIR).libelle).toBe('bon');
    expect(niveau(6, ECH_AIR).libelle).toBe('extrême');
  });

  it('ECH_PLUIE et ECH_VENT reprennent les seuils et couleurs exacts du mockup', () => {
    expect(niveau(0.2, ECH_PLUIE)).toEqual({ seuil: 0.2, couleur: '#BFD4E0', libelle: 'bruine' });
    expect(niveau(8, ECH_PLUIE).libelle).toBe('forte');
    expect(niveau(15, ECH_VENT)).toEqual({ seuil: 15, couleur: '#8FC0A6', libelle: 'calme' });
    expect(niveau(80, ECH_VENT).libelle).toBe('fort');
  });

  it('une valeur au-delà du dernier seuil retombe sur le dernier niveau, jamais une erreur', () => {
    expect(niveau(1000, ECH_VENT).libelle).toBe('tempête');
  });
});

describe('plafond de l\'axe des colonnes (§5.2)', () => {
  it("est la borne haute de la bande qui contient le pic, pas le pic lui-même", () => {
    // pic = 3 mm/h tombe dans la bande « modérée » (seuil 4), pas dans son propre seuil de 3.
    expect(plafondAxeColonnes([0.1, 3, 1], ECH_PLUIE)).toBe(4);
    expect(plafondAxeColonnes([0.1, 3, 1], ECH_PLUIE)).not.toBe(3);
  });

  it('ne descend jamais sous le seuil de la première bande, même série vide ou nulle', () => {
    expect(plafondAxeColonnes([], ECH_UV)).toBe(2);
    expect(plafondAxeColonnes([0, 0, 0], ECH_UV)).toBe(2);
  });

  it('remonte au-delà du seuil de bande si le pic lui-même le dépasse (bande sans borne fixe)', () => {
    // 250 km/h dépasse le seuil « tempête » (199) : le plafond suit le pic, pas le seuil figé.
    expect(plafondAxeColonnes([250], ECH_VENT)).toBe(250);
  });
});

describe('catalogue des six métriques (§5.2)', () => {
  it('compte exactement six métriques, deux en polyligne et quatre en colonnes', () => {
    expect(IDS_METRIQUES).toHaveLength(6);
    const enLigne = IDS_METRIQUES.filter((id) => METRIQUES[id].type === 'ligne');
    const enColonne = IDS_METRIQUES.filter((id) => METRIQUES[id].type === 'colonne');
    expect(enLigne.sort()).toEqual(['ress', 'temp']);
    expect(enColonne.sort()).toEqual(['air', 'pluie', 'uv', 'vent']);
  });
});
