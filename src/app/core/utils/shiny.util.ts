import { SHINY_CHANCE } from '@core/consts/shiny.const';

export function getShinyPrice(basePrice: number): number {
  return Math.round(basePrice * 3);
}

export function isShiny(): boolean {
  const shinyChance = 1 / 1000;
  return Math.random() < shinyChance;
}

export function rollForShiny(rng: () => number = Math.random): boolean {
  return rng() < SHINY_CHANCE;
}
