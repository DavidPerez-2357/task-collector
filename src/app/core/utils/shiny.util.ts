import { SHINY_CHANCE } from '@core/consts/shiny.const';

export function getShinyPrice(basePrice: number): number {
  return Math.round(basePrice * 3);
}

export function rollForShiny(rng: () => number = Math.random, bonusChance: number = 0): boolean {
  return rng() < SHINY_CHANCE + bonusChance;
}
