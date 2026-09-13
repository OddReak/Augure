import { describe, expect, it, vi } from 'vitest';
import { estSigneMeteoConnu, palierDuSymboleForeca, signeDuSymboleForeca } from '../../src/domain/symboles';
import { IDS_SIGNES_METEO } from '../../src/domain/signes';

describe('décodage des symboles Foreca', () => {
  it('d421 (exemple de la documentation Foreca) est décodé en jour, couvert, averses de grésil → grêle', () => {
    expect(signeDuSymboleForeca('d421')).toBe('grele');
  });

  it('un code inconnu retombe sur couvert et journalise un avertissement', () => {
    const espion = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(signeDuSymboleForeca('xyz9')).toBe('couvert');
    expect(signeDuSymboleForeca('d999')).toBe('couvert');
    expect(espion).toHaveBeenCalledTimes(2);
    espion.mockRestore();
  });

  it('le préfixe n produit le palier veille, quelle que soit la condition', () => {
    expect(palierDuSymboleForeca('n000')).toBe('veille');
    expect(palierDuSymboleForeca('n300')).toBe('veille');
  });

  it('un ciel dégagé de jour produit le palier vigies', () => {
    expect(palierDuSymboleForeca('d000')).toBe('vigies');
  });

  it('la pluie produit le palier ondee, l\'orage et la grêle le palier colere', () => {
    expect(palierDuSymboleForeca('d130')).toBe('ondee');
    expect(palierDuSymboleForeca('d240')).toBe('colere'); // taux 4 = orageux
    expect(palierDuSymboleForeca('d421')).toBe('colere'); // grêle
  });

  it('une vigilance orange ou rouge impose colere même par ciel dégagé', () => {
    expect(palierDuSymboleForeca('d000', { vigilance: 'orange' })).toBe('colere');
  });

  it('une température ≥34° ou un indice UV ≥8 impose fournaise', () => {
    expect(palierDuSymboleForeca('d000', { temperatureC: 35 })).toBe('fournaise');
    expect(palierDuSymboleForeca('d000', { indiceUv: 9 })).toBe('fournaise');
  });

  it('aucun symbole du champ documenté par Foreca n\'est orphelin', () => {
    const espion = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const prefixe of ['d', 'n']) {
      for (let nebulosite = 0; nebulosite <= 6; nebulosite++) {
        for (let taux = 0; taux <= 4; taux++) {
          for (let type = 0; type <= 2; type++) {
            const code = `${prefixe}${nebulosite}${taux}${type}`;
            const signe = signeDuSymboleForeca(code);
            expect(estSigneMeteoConnu(signe)).toBe(true);
          }
        }
      }
    }
    // Aucun de ces 630 codes n'est malformé au sens du motif : jamais de repli journalisé ici.
    expect(espion).not.toHaveBeenCalled();
    espion.mockRestore();
  });
});

describe('table des seize signes météo', () => {
  it('contient exactement seize entrées', () => {
    expect(IDS_SIGNES_METEO).toHaveLength(16);
  });
});
