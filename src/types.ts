// Genetic traits that define organism characteristics
export interface DNA {
  speed: number; // Movement speed multiplier
  efficiency: number; // Energy efficiency (lower = less energy consumed)
  aggression: number; // Likelihood to hunt other organisms
  size: number; // Base size multiplier
  reproductionThreshold: number; // Energy needed to reproduce
  lifespan: number; // Maximum age in ticks
  socialness: number; // Tendency to flock with others
}

// Different organism species with unique behaviors
export type SpeciesType = "herbivore" | "carnivore" | "omnivore";

export const SpeciesType = {
  HERBIVORE: "herbivore" as const,
  CARNIVORE: "carnivore" as const,
  OMNIVORE: "omnivore" as const,
};

// Visual trail system for organism movement
export interface Trail {
  x: number;
  y: number;
  alpha: number;
  color: string;
}

// Particle effects for various events
export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Environmental obstacles
export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Statistics tracking
export interface Stats {
  herbivoreCount: number;
  carnivoreCount: number;
  omnivoreCount: number;
  totalPopulation: number;
  averageAge: number;
  averageEnergy: number;
  foodCount: number;
  reproductionEvents: number;
  deathEvents: number;
  generationTime: number;
}

export interface EnhancedStats extends Stats {
  geneticDiversity: number;
  selectionPressure: number;
  adaptationRate: number;
  predationRate: number;
  foodScarcity: number;
  dayNightPhase: number;
  fps: number;
  populationTrend: "up" | "down" | "stable";
  foodTrend: "up" | "down" | "stable";
}

export interface SimulationSettings {
  foodSpawnRate: number;
  maxFood: number;
  initialHerbivores: number;
  initialCarnivores: number;
  initialOmnivores: number;
  showTrails: boolean;
  showParticles: boolean;
  dayNightCycle: boolean;
}

export type ClickAction = "food" | "herbivore" | "carnivore" | "omnivore";