import { beforeEach, describe, expect, it } from 'vitest';
import {
  derniereReponseConnue,
  enregistrerAppel,
  memoriserDerniereReponse,
  quotaDegrade,
  reinitialiserQuota,
} from '../../api/_lib/quota';

const JOUR_1 = Date.parse('2026-09-19T10:00:00Z');
const JOUR_2 = Date.parse('2026-09-20T10:00:00Z');

describe('garde-fou de quota Foreca (§4.1, acceptation phase 7)', () => {
  beforeEach(() => {
    reinitialiserQuota();
  });

  it("n'est pas dégradé sous 85 % du budget de 2000 appels/jour", () => {
    for (let i = 0; i < 1699; i += 1) enregistrerAppel(() => JOUR_1);
    expect(quotaDegrade(() => JOUR_1)).toBe(false);
  });

  it('se dégrade à partir de 85 % du budget (1700 appels)', () => {
    for (let i = 0; i < 1700; i += 1) enregistrerAppel(() => JOUR_1);
    expect(quotaDegrade(() => JOUR_1)).toBe(true);
  });

  it('se réinitialise sur un nouveau jour (UTC)', () => {
    for (let i = 0; i < 1900; i += 1) enregistrerAppel(() => JOUR_1);
    expect(quotaDegrade(() => JOUR_1)).toBe(true);
    expect(quotaDegrade(() => JOUR_2)).toBe(false);
  });

  it('mémorise et restitue la dernière réponse connue par clé', () => {
    expect(derniereReponseConnue('current:x')).toBeUndefined();
    memoriserDerniereReponse('current:x', { temperature: 28 });
    expect(derniereReponseConnue('current:x')).toEqual({ temperature: 28 });
    expect(derniereReponseConnue('current:y')).toBeUndefined();
  });
});
