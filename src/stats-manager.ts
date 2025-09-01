import type { EnhancedStats } from "./types";
import { SpeciesType } from "./types";
import { Organism } from "./organism";
import { Food } from "./food";

export class EnhancedStatsManager {
  private previousStats: EnhancedStats | null = null;
  private tooltip: HTMLElement;
  private fpsCounter: number[] = [];
  private lastFrameTime: number = 0;

  constructor() {
    this.tooltip =
      document.getElementById("statsTooltip") || document.createElement("div");
    setTimeout(() => this.setupEventListeners(), 100); // Defer setup to ensure DOM is ready
  }

  setupEventListeners(): void {
    // Simplified setup for basic stats panel
    // Future: Add click handlers for expanding/collapsing stats
  }

  showTooltip(event: MouseEvent, text: string): void {
    this.tooltip.textContent = text;
    this.tooltip.classList.add("visible");
    this.updateTooltipPosition(event);
  }

  hideTooltip(): void {
    this.tooltip.classList.remove("visible");
  }

  updateTooltipPosition(event: MouseEvent): void {
    const rect = this.tooltip.getBoundingClientRect();
    let x = event.clientX + 10;
    let y = event.clientY - rect.height - 10;

    if (x + rect.width > window.innerWidth) {
      x = event.clientX - rect.width - 10;
    }
    if (y < 0) {
      y = event.clientY + 10;
    }

    this.tooltip.style.left = x + "px";
    this.tooltip.style.top = y + "px";
  }

  calculateGeneticDiversity(organisms: Organism[]): number {
    if (organisms.length === 0) return 0;

    const traits = ["speed", "efficiency", "aggression", "size", "socialness"];
    let totalVariance = 0;

    for (const trait of traits) {
      const values = organisms.map((org) => (org.dna as any)[trait]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      totalVariance += variance;
    }

    return Math.min(100, (totalVariance / traits.length) * 100);
  }

  calculateSelectionPressure(organisms: Organism[], food: Food[]): number {
    if (organisms.length === 0) return 0;

    const foodPerOrganism = food.length / organisms.length;
    const avgEnergy =
      organisms.reduce((sum, org) => sum + org.energy, 0) / organisms.length;
    const maxPossibleEnergy =
      organisms.reduce((sum, org) => sum + org.maxEnergy, 0) / organisms.length;

    const energyRatio = avgEnergy / maxPossibleEnergy;
    const foodPressure = Math.max(0, 1 - foodPerOrganism / 2);

    return Math.min(100, (foodPressure + (1 - energyRatio)) * 50);
  }

  calculatePredationRate(organisms: Organism[]): number {
    const carnivores = organisms.filter(
      (org) => org.species === SpeciesType.CARNIVORE
    ).length;
    const aggressiveOmnivores = organisms.filter(
      (org) => org.species === SpeciesType.OMNIVORE && org.dna.aggression > 0.6
    ).length;
    const totalPredators = carnivores + aggressiveOmnivores;
    const totalPrey = organisms.filter(
      (org) => org.species === SpeciesType.HERBIVORE
    ).length;

    if (totalPrey === 0) return 0;
    return Math.min(100, (totalPredators / totalPrey) * 100);
  }

  calculateFoodScarcity(organisms: Organism[], food: Food[]): number {
    if (organisms.length === 0) return 0;
    const foodPerOrganism = food.length / organisms.length;
    return Math.max(0, Math.min(100, (1 - foodPerOrganism / 3) * 100));
  }

  calculateFPS(): number {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameDelta = now - this.lastFrameTime;
      this.fpsCounter.push(1000 / frameDelta);
      if (this.fpsCounter.length > 60) {
        this.fpsCounter.shift();
      }
    }
    this.lastFrameTime = now;

    if (this.fpsCounter.length === 0) return 60;
    return Math.round(
      this.fpsCounter.reduce((sum, fps) => sum + fps, 0) /
        this.fpsCounter.length
    );
  }

  getTrend(
    current: number,
    previous: number | undefined
  ): "up" | "down" | "stable" {
    if (previous === undefined) return "stable";
    const diff = current - previous;
    const threshold = Math.abs(previous) * 0.05; // 5% threshold

    if (Math.abs(diff) < threshold) return "stable";
    return diff > 0 ? "up" : "down";
  }

  updateEnhancedStats(organisms: Organism[], food: Food[], world: any): void {
    const basicStats = world.stats;

    const enhancedStats: EnhancedStats = {
      ...basicStats,
      geneticDiversity: this.calculateGeneticDiversity(organisms),
      selectionPressure: this.calculateSelectionPressure(organisms, food),
      adaptationRate: Math.random() * 100, // Placeholder - would need historical genetic data
      predationRate: this.calculatePredationRate(organisms),
      foodScarcity: this.calculateFoodScarcity(organisms, food),
      dayNightPhase: (world.time % 7200) / 7200,
      fps: this.calculateFPS(),
      populationTrend: this.getTrend(
        basicStats.totalPopulation,
        this.previousStats?.totalPopulation
      ),
      foodTrend: this.getTrend(
        basicStats.foodCount,
        this.previousStats?.foodCount
      ),
    };

    this.updateUI(enhancedStats, world);
    this.previousStats = enhancedStats;
  }

  updateUI(stats: EnhancedStats, _world: any): void {
    // Update population count in sidebar
    this.updateElement("pop-count", stats.totalPopulation.toString());
  }

  updateElement(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  updateTrend(id: string, trend: "up" | "down" | "stable"): void {
    const element = document.getElementById(id);
    if (element) {
      element.className = `trend-indicator ${trend}`;
    }
  }

  updateHealthIndicator(id: string, value: number): void {
    const element = document.getElementById(id);
    if (element) {
      element.className = `health-indicator ${this.getHealthClass(value)}`;
    }
  }

  getHealthClass(value: number): string {
    if (value >= 70) return "good";
    if (value >= 40) return "warning";
    return "danger";
  }

  getPressureLabel(value: number): string {
    if (value >= 70) return "High";
    if (value >= 40) return "Medium";
    return "Low";
  }

  getScarcityLabel(value: number): string {
    if (value >= 70) return "High";
    if (value >= 40) return "Medium";
    return "Low";
  }

  updateDayNight(phase: number): void {
    const dayPhase = Math.sin(phase * Math.PI * 2);
    const icon = document.getElementById("day-night-icon");
    const value = document.getElementById("day-night-value");

    if (icon && value) {
      if (dayPhase > 0) {
        icon.className = "fas fa-sun";
        value.textContent = "Day";
      } else {
        icon.className = "fas fa-moon";
        value.textContent = "Night";
      }
    }
  }
}