import { describe, expect, it } from 'vitest';
import { eaqiDepuisAqiUs } from '../../src/domain/qualiteAir';

describe("conversion AQI américain → bande EAQI européenne (§5.2, ECH_AIR)", () => {
  it.each([
    [0, 1],
    [50, 1],
    [51, 2],
    [100, 2],
    [101, 3],
    [150, 3],
    [151, 4],
    [200, 4],
    [201, 5],
    [300, 5],
    [301, 6],
    [500, 6],
  ])('AQI %i → bande EAQI %i', (aqi, bandeAttendue) => {
    expect(eaqiDepuisAqiUs(aqi)).toBe(bandeAttendue);
  });
});
