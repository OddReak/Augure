import { beforeEach, describe, expect, it } from 'vitest';
import { autoriser, reinitialiserLimite } from '../../api/_lib/limite';

describe("limite de débit par IP (§4.1, généreuse, coupe un script)", () => {
  beforeEach(() => {
    reinitialiserLimite();
  });

  it('autorise jusqu’au plafond puis refuse dans la même fenêtre', () => {
    const horloge = () => 0;
    for (let i = 0; i < 60; i += 1) {
      expect(autoriser('1.2.3.4', horloge)).toBe(true);
    }
    expect(autoriser('1.2.3.4', horloge)).toBe(false);
  });

  it('ne mélange pas les compteurs de deux IP différentes', () => {
    const horloge = () => 0;
    for (let i = 0; i < 60; i += 1) autoriser('1.2.3.4', horloge);
    expect(autoriser('5.6.7.8', horloge)).toBe(true);
  });

  it('redonne du crédit une fois la fenêtre glissante écoulée', () => {
    let maintenant = 0;
    const horloge = () => maintenant;
    for (let i = 0; i < 60; i += 1) autoriser('1.2.3.4', horloge);
    expect(autoriser('1.2.3.4', horloge)).toBe(false);
    maintenant = 60_001;
    expect(autoriser('1.2.3.4', horloge)).toBe(true);
  });
});
