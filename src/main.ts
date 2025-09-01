import './style.css';
import './override.css';

// Genetic traits that define organism characteristics
interface DNA {
  speed: number; // Movement speed multiplier
  efficiency: number; // Energy efficiency (lower = less energy consumed)
  aggression: number; // Likelihood to hunt other organisms
  size: number; // Base size multiplier
  reproductionThreshold: number; // Energy needed to reproduce
  lifespan: number; // Maximum age in ticks
  socialness: number; // Tendency to flock with others
}

// Different organism species with unique behaviors
type SpeciesType = "herbivore" | "carnivore" | "omnivore";

const SpeciesType = {
  HERBIVORE: "herbivore" as const,
  CARNIVORE: "carnivore" as const,
  OMNIVORE: "omnivore" as const,
};

// Visual trail system for organism movement
interface Trail {
  x: number;
  y: number;
  alpha: number;
  color: string;
}

// Particle effects for various events
interface Particle {
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
interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Advanced organism with genetics, AI, and complex behaviors
class Organism {
  x: number;
  y: number;
  dx: number;
  dy: number;
  energy: number;
  maxEnergy: number;
  age: number;
  dna: DNA;
  species: SpeciesType;
  trails: Trail[] = [];
  targetX?: number;
  targetY?: number;
  reproductionCooldown: number = 0;

  constructor(x: number, y: number, species: SpeciesType, dna?: DNA) {
    this.x = x;
    this.y = y;
    this.species = species;
    this.age = 0;

    // Generate DNA if not provided (for initial population)
    this.dna = dna || this.generateRandomDNA();

    // Set initial values based on genetics
    this.maxEnergy = 80 + this.dna.size * 40;
    this.energy = this.maxEnergy * 0.8;

    // Random initial velocity modified by speed gene
    const baseSpeed = this.dna.speed;
    this.dx = (Math.random() - 0.5) * 4 * baseSpeed;
    this.dy = (Math.random() - 0.5) * 4 * baseSpeed;
  }

  generateRandomDNA(): DNA {
    return {
      speed: 0.5 + Math.random() * 1.0,
      efficiency: 0.5 + Math.random() * 1.0,
      aggression: Math.random(),
      size: 0.8 + Math.random() * 0.4,
      reproductionThreshold: 60 + Math.random() * 40,
      lifespan: 1500 + Math.random() * 3000,
      socialness: Math.random(),
    };
  }

  // Advanced AI behavior with pathfinding and flocking
  updateAI(organisms: Organism[], food: Food[]): void {
    // Find nearest food if herbivore/omnivore and hungry
    if (
      (this.species === SpeciesType.HERBIVORE ||
        this.species === SpeciesType.OMNIVORE) &&
      this.energy < this.maxEnergy * 0.7 &&
      food.length > 0
    ) {
      const nearestFood = this.findNearest(
        food.map((f) => ({ x: f.x, y: f.y }))
      );
      if (nearestFood) {
        this.targetX = nearestFood.x;
        this.targetY = nearestFood.y;
      }
    }

    // Carnivores and aggressive omnivores hunt other organisms
    if (
      (this.species === SpeciesType.CARNIVORE ||
        (this.species === SpeciesType.OMNIVORE && this.dna.aggression > 0.5)) &&
      this.energy < this.maxEnergy * 0.6
    ) {
      const prey = organisms.filter(
        (o) =>
          o !== this &&
          (o.species === SpeciesType.HERBIVORE ||
            (o.species === SpeciesType.OMNIVORE &&
              o.getRadius() < this.getRadius()))
      );

      if (prey.length > 0) {
        const nearestPrey = this.findNearest(
          prey.map((p) => ({ x: p.x, y: p.y }))
        );
        if (nearestPrey) {
          this.targetX = nearestPrey.x;
          this.targetY = nearestPrey.y;
        }
      }
    }

    // Flocking behavior for social organisms
    if (this.dna.socialness > 0.5) {
      this.applyFlocking(organisms);
    }

    // Move towards target or wander
    if (this.targetX !== undefined && this.targetY !== undefined) {
      this.moveTowards(this.targetX, this.targetY);
    } else {
      // Random wandering with some momentum
      this.dx += (Math.random() - 0.5) * 0.3;
      this.dy += (Math.random() - 0.5) * 0.3;
    }
  }

  findNearest(
    targets: { x: number; y: number }[]
  ): { x: number; y: number } | null {
    if (targets.length === 0) return null;

    let nearest = targets[0];
    let minDistance = this.distanceTo(nearest.x, nearest.y);

    for (const target of targets) {
      const distance = this.distanceTo(target.x, target.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = target;
      }
    }

    return nearest;
  }

  moveTowards(targetX: number, targetY: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const speed = this.dna.speed * 2;
      this.dx += (dx / distance) * speed * 0.1;
      this.dy += (dy / distance) * speed * 0.1;
    } else {
      // Reached target, clear it
      this.targetX = undefined;
      this.targetY = undefined;
    }
  }

  applyFlocking(organisms: Organism[]): void {
    const neighbors = organisms.filter(
      (o) =>
        o !== this &&
        o.species === this.species &&
        this.distanceTo(o.x, o.y) < 80
    );

    if (neighbors.length === 0) return;

    // Cohesion: move towards center of neighbors
    let centerX = 0,
      centerY = 0;
    for (const neighbor of neighbors) {
      centerX += neighbor.x;
      centerY += neighbor.y;
    }
    centerX /= neighbors.length;
    centerY /= neighbors.length;

    const cohesionForce = 0.002 * this.dna.socialness;
    this.dx += (centerX - this.x) * cohesionForce;
    this.dy += (centerY - this.y) * cohesionForce;

    // Separation: avoid crowding
    for (const neighbor of neighbors) {
      const distance = this.distanceTo(neighbor.x, neighbor.y);
      if (distance < 30 && distance > 0) {
        const separationForce = 0.05 / distance;
        this.dx -= (neighbor.x - this.x) * separationForce;
        this.dy -= (neighbor.y - this.y) * separationForce;
      }
    }
  }

  update(
    canvasWidth: number,
    canvasHeight: number,
    obstacles: Obstacle[]
  ): void {
    // Age the organism
    this.age++;

    // Move organism
    this.x += this.dx;
    this.y += this.dy;

    // Obstacle collision
    for (const obstacle of obstacles) {
      if (this.isCollidingWithObstacle(obstacle)) {
        // Bounce off obstacle
        if (this.x < obstacle.x || this.x > obstacle.x + obstacle.width) {
          this.dx = -this.dx;
        }
        if (this.y < obstacle.y || this.y > obstacle.y + obstacle.height) {
          this.dy = -this.dy;
        }
        // Push organism away from obstacle
        this.x -= this.dx;
        this.y -= this.dy;
      }
    }

    // Bounce off walls
    const radius = this.getRadius();
    if (this.x <= radius || this.x >= canvasWidth - radius) {
      this.dx = -this.dx;
    }
    if (this.y <= radius || this.y >= canvasHeight - radius) {
      this.dy = -this.dy;
    }

    // Keep organism within bounds
    this.x = Math.max(radius, Math.min(canvasWidth - radius, this.x));
    this.y = Math.max(radius, Math.min(canvasHeight - radius, this.y));

    // Apply friction
    this.dx *= 0.99;
    this.dy *= 0.99;

    // Speed limit based on genetics
    const maxSpeed = this.dna.speed * 3;
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (currentSpeed > maxSpeed) {
      this.dx = (this.dx / currentSpeed) * maxSpeed;
      this.dy = (this.dy / currentSpeed) * maxSpeed;
    }

    // Energy consumption based on movement and genetics
    const energyConsumption = (0.1 + currentSpeed * 0.1) / this.dna.efficiency;
    this.energy -= energyConsumption;

    // Update trails
    this.updateTrails();

    // Reproduction cooldown
    if (this.reproductionCooldown > 0) {
      this.reproductionCooldown--;
    }
  }

  updateTrails(): void {
    // Add new trail point
    this.trails.push({
      x: this.x,
      y: this.y,
      alpha: 1.0,
      color: this.getSpeciesColor(),
    });

    // Update existing trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].alpha -= 0.05;
      if (this.trails[i].alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // Limit trail length
    if (this.trails.length > 20) {
      this.trails.shift();
    }
  }

  getRadius(): number {
    // Size based on genetics and current energy
    const energyFactor = Math.sqrt(this.energy / this.maxEnergy);
    return Math.max(3, (4 + this.dna.size * 4) * energyFactor);
  }

  getSpeciesColor(): string {
    switch (this.species) {
      case SpeciesType.HERBIVORE:
        return "#4CAF50"; // Green
      case SpeciesType.CARNIVORE:
        return "#F44336"; // Red
      case SpeciesType.OMNIVORE:
        return "#FF9800"; // Orange
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw trails first
    for (const trail of this.trails) {
      ctx.globalAlpha = trail.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = trail.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw organism
    const radius = this.getRadius();
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);

    // Color based on energy level and species
    const energyRatio = Math.max(0, this.energy / this.maxEnergy);
    const baseColor = this.getSpeciesColor();

    // Darken color as energy decreases
    const r = parseInt(baseColor.substring(1, 3), 16);
    const g = parseInt(baseColor.substring(3, 5), 16);
    const b = parseInt(baseColor.substring(5, 7), 16);

    const finalR = Math.floor(r * energyRatio);
    const finalG = Math.floor(g * energyRatio);
    const finalB = Math.floor(b * energyRatio);

    ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw age indicator (small ring around organism)
    if (this.age > this.dna.lifespan * 0.7) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  distanceTo(x: number, y: number): number {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isCollidingWith(other: { x: number; y: number; radius?: number }): boolean {
    const distance = this.distanceTo(other.x, other.y);
    const otherRadius = other.radius || 3;
    return distance < this.getRadius() + otherRadius;
  }

  isCollidingWithObstacle(obstacle: Obstacle): boolean {
    const radius = this.getRadius();
    return (
      this.x + radius > obstacle.x &&
      this.x - radius < obstacle.x + obstacle.width &&
      this.y + radius > obstacle.y &&
      this.y - radius < obstacle.y + obstacle.height
    );
  }

  canReproduce(): boolean {
    return (
      this.energy > this.dna.reproductionThreshold &&
      this.reproductionCooldown === 0 &&
      this.age > 200
    ); // Must be mature
  }

  reproduce(partner?: Organism): Organism {
    // Energy cost of reproduction
    this.energy -= this.dna.reproductionThreshold * 0.6;
    this.reproductionCooldown = 300; // Prevent immediate re-reproduction

    // Create offspring with mixed genetics
    let childDNA: DNA;
    if (partner) {
      // Sexual reproduction - mix parent genes
      childDNA = {
        speed:
          (this.dna.speed + partner.dna.speed) / 2 +
          (Math.random() - 0.5) * 0.2,
        efficiency:
          (this.dna.efficiency + partner.dna.efficiency) / 2 +
          (Math.random() - 0.5) * 0.2,
        aggression:
          (this.dna.aggression + partner.dna.aggression) / 2 +
          (Math.random() - 0.5) * 0.2,
        size:
          (this.dna.size + partner.dna.size) / 2 + (Math.random() - 0.5) * 0.1,
        reproductionThreshold:
          (this.dna.reproductionThreshold + partner.dna.reproductionThreshold) /
            2 +
          (Math.random() - 0.5) * 10,
        lifespan:
          (this.dna.lifespan + partner.dna.lifespan) / 2 +
          (Math.random() - 0.5) * 500,
        socialness:
          (this.dna.socialness + partner.dna.socialness) / 2 +
          (Math.random() - 0.5) * 0.2,
      };
    } else {
      // Asexual reproduction - slight mutation
      childDNA = {
        speed: this.dna.speed + (Math.random() - 0.5) * 0.1,
        efficiency: this.dna.efficiency + (Math.random() - 0.5) * 0.1,
        aggression: this.dna.aggression + (Math.random() - 0.5) * 0.1,
        size: this.dna.size + (Math.random() - 0.5) * 0.05,
        reproductionThreshold:
          this.dna.reproductionThreshold + (Math.random() - 0.5) * 5,
        lifespan: this.dna.lifespan + (Math.random() - 0.5) * 200,
        socialness: this.dna.socialness + (Math.random() - 0.5) * 0.1,
      };
    }

    // Clamp values to reasonable ranges
    childDNA.speed = Math.max(0.2, Math.min(2.0, childDNA.speed));
    childDNA.efficiency = Math.max(0.2, Math.min(2.0, childDNA.efficiency));
    childDNA.aggression = Math.max(0, Math.min(1, childDNA.aggression));
    childDNA.size = Math.max(0.5, Math.min(1.5, childDNA.size));
    childDNA.reproductionThreshold = Math.max(
      40,
      Math.min(120, childDNA.reproductionThreshold)
    );
    childDNA.lifespan = Math.max(1000, Math.min(6000, childDNA.lifespan));
    childDNA.socialness = Math.max(0, Math.min(1, childDNA.socialness));

    // Spawn near parent
    const angle = Math.random() * Math.PI * 2;
    const distance = this.getRadius() + 10;
    const childX = this.x + Math.cos(angle) * distance;
    const childY = this.y + Math.sin(angle) * distance;

    return new Organism(childX, childY, this.species, childDNA);
  }

  isDead(): boolean {
    return this.energy <= 0 || this.age > this.dna.lifespan;
  }
}

class Food {
  x: number;
  y: number;
  radius: number = 3;
  energy: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.energy = 25 + Math.random() * 15; // Variable energy content
    this.radius = 2 + (this.energy / 40) * 3; // Size based on energy
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // Color intensity based on energy content
    const intensity = Math.floor(this.energy * 4);
    ctx.fillStyle = `rgb(0, ${intensity}, 0)`;
    ctx.fill();
    ctx.strokeStyle = "#00aa00";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Statistics tracking
interface Stats {
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

interface EnhancedStats extends Stats {
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

interface SimulationSettings {
  foodSpawnRate: number;
  maxFood: number;
  initialHerbivores: number;
  initialCarnivores: number;
  initialOmnivores: number;
  showTrails: boolean;
  showParticles: boolean;
  dayNightCycle: boolean;
}

class EnhancedStatsManager {
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

  updateEnhancedStats(organisms: Organism[], food: Food[], world: World): void {
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

  updateUI(stats: EnhancedStats, _world: World): void {
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

type ClickAction = "food" | "herbivore" | "carnivore" | "omnivore";

class UIManager {
  private selectedOrganism: Organism | null = null;
  private settings: SimulationSettings;
  private world: World | null = null;
  private currentAction: ClickAction = "food";

  setWorld(world: World): void {
    this.world = world;
  }

  getCurrentAction(): ClickAction {
    return this.currentAction;
  }

  setCurrentAction(action: ClickAction): void {
    this.currentAction = action;
  }

  selectAction(action: ClickAction): void {
    this.currentAction = action;
    this.updateCurrentActionButton(action);
    this.updateActionOptions(action);
  }

  private updateCurrentActionButton(action: ClickAction): void {
    const currentActionBtn = document.getElementById("currentActionBtn");
    if (!currentActionBtn) return;

    const icon = currentActionBtn.querySelector("i:first-child");
    const span = currentActionBtn.querySelector("span");

    // Update button content based on selected action
    switch (action) {
      case "food":
        if (icon) {
          icon.className = "fas fa-apple-alt";
        }
        if (span) {
          span.textContent = "Food";
        }
        break;
      case "herbivore":
        if (icon) {
          icon.className = "creature-icon herbivore";
          (icon as HTMLElement).style.width = "16px";
          (icon as HTMLElement).style.height = "16px";
        }
        if (span) {
          span.textContent = "Herbivore";
        }
        break;
      case "carnivore":
        if (icon) {
          icon.className = "creature-icon carnivore";
          (icon as HTMLElement).style.width = "16px";
          (icon as HTMLElement).style.height = "16px";
        }
        if (span) {
          span.textContent = "Carnivore";
        }
        break;
      case "omnivore":
        if (icon) {
          icon.className = "creature-icon omnivore";
          (icon as HTMLElement).style.width = "16px";
          (icon as HTMLElement).style.height = "16px";
        }
        if (span) {
          span.textContent = "Omnivore";
        }
        break;
    }
  }

  private updateActionOptions(selectedAction: ClickAction): void {
    document.querySelectorAll(".action-option").forEach((option) => {
      option.classList.remove("active");
      if (option.getAttribute("data-action") === selectedAction) {
        option.classList.add("active");
      }
    });
  }

  constructor() {
    this.settings = {
      foodSpawnRate: 50,
      maxFood: 100,
      initialHerbivores: 25,
      initialCarnivores: 10,
      initialOmnivores: 15,
      showTrails: true,
      showParticles: true,
      dayNightCycle: true,
    };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Play/Pause button
    const playPauseBtn = document.getElementById(
      "playPauseBtn"
    ) as HTMLButtonElement;
    playPauseBtn?.addEventListener("click", () => {
      const icon = playPauseBtn.querySelector("i");
      if (!this.world) return;
      if (this.world.paused) {
        this.world.paused = false;
        icon?.classList.replace("fa-play", "fa-pause");
      } else {
        this.world.paused = true;
        icon?.classList.replace("fa-pause", "fa-play");
      }
    });

    // Speed controls
    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".speed-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (this.world) {
          this.world.speed = parseFloat(btn.getAttribute("data-speed") || "1");
        }
      });
    });

    // Reset button
    const resetBtn = document.getElementById("resetBtn");
    resetBtn?.addEventListener("click", () => {
      this.world?.reset();
    });

    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    settingsBtn?.addEventListener("click", () => {
      settingsModal?.classList.add("active");
      this.populateSettings();
    });

    // Close modal
    const closeBtn = settingsModal?.querySelector(".close-btn");
    closeBtn?.addEventListener("click", () => {
      settingsModal?.classList.remove("active");
    });

    // Click outside modal to close
    settingsModal?.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });

    // Apply settings
    const applyBtn = document.getElementById("applySettings");
    applyBtn?.addEventListener("click", () => {
      this.applySettings();
      settingsModal?.classList.remove("active");
    });

    // Reset settings
    const resetSettingsBtn = document.getElementById("resetSettings");
    resetSettingsBtn?.addEventListener("click", () => {
      this.resetSettings();
    });

    // Sidebar toggles
    const toggleStatsBtn = document.getElementById("toggleStatsBtn");
    const sidebarLeft = document.getElementById("sidebar-left");
    const floatingToggleLeft = document.getElementById("floatingToggleLeft");

    const toggleLeftSidebar = () => {
      sidebarLeft?.classList.toggle("collapsed");
      const icon = toggleStatsBtn?.querySelector("i");
      if (sidebarLeft?.classList.contains("collapsed")) {
        icon?.classList.replace("fa-chevron-left", "fa-chevron-right");
        document.body.classList.add("left-sidebar-collapsed");
      } else {
        icon?.classList.replace("fa-chevron-right", "fa-chevron-left");
        document.body.classList.remove("left-sidebar-collapsed");
      }
    };

    toggleStatsBtn?.addEventListener("click", toggleLeftSidebar);
    floatingToggleLeft?.addEventListener("click", toggleLeftSidebar);

    const toggleInspectorBtn = document.getElementById("toggleInspectorBtn");
    const sidebarRight = document.getElementById("sidebar-right");
    const floatingToggleRight = document.getElementById("floatingToggleRight");

    const toggleRightSidebar = () => {
      sidebarRight?.classList.toggle("collapsed");
      const icon = toggleInspectorBtn?.querySelector("i");
      if (sidebarRight?.classList.contains("collapsed")) {
        icon?.classList.replace("fa-chevron-right", "fa-chevron-left");
        document.body.classList.add("right-sidebar-collapsed");
      } else {
        icon?.classList.replace("fa-chevron-left", "fa-chevron-right");
        document.body.classList.remove("right-sidebar-collapsed");
      }
    };

    toggleInspectorBtn?.addEventListener("click", toggleRightSidebar);
    floatingToggleRight?.addEventListener("click", toggleRightSidebar);

    // Range input updates
    document.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const valueSpan = target.parentElement?.querySelector(".setting-value");
        if (valueSpan) {
          valueSpan.textContent = target.value;
        }
      });
    });

    // Action selector dropdown
    const currentActionBtn = document.getElementById("currentActionBtn");
    const actionDropdown = document.getElementById("actionDropdown");

    // Toggle dropdown
    currentActionBtn?.addEventListener("click", () => {
      const isActive = currentActionBtn.classList.contains("active");
      if (isActive) {
        currentActionBtn.classList.remove("active");
        actionDropdown?.classList.remove("active");
      } else {
        currentActionBtn.classList.add("active");
        actionDropdown?.classList.add("active");
      }
    });

    // Handle action selection
    document.querySelectorAll(".action-option").forEach((option) => {
      option.addEventListener("click", () => {
        const action = option.getAttribute("data-action") as ClickAction;
        this.selectAction(action);

        // Close dropdown
        currentActionBtn?.classList.remove("active");
        actionDropdown?.classList.remove("active");
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !currentActionBtn?.contains(e.target as Node) &&
        !actionDropdown?.contains(e.target as Node)
      ) {
        currentActionBtn?.classList.remove("active");
        actionDropdown?.classList.remove("active");
      }
    });
  }

  private populateSettings(): void {
    (document.getElementById("foodSpawnRate") as HTMLInputElement).value =
      this.settings.foodSpawnRate.toString();
    (document.getElementById("maxFood") as HTMLInputElement).value =
      this.settings.maxFood.toString();
    (document.getElementById("initialHerbivores") as HTMLInputElement).value =
      this.settings.initialHerbivores.toString();
    (document.getElementById("initialCarnivores") as HTMLInputElement).value =
      this.settings.initialCarnivores.toString();
    (document.getElementById("initialOmnivores") as HTMLInputElement).value =
      this.settings.initialOmnivores.toString();
    (document.getElementById("showTrails") as HTMLInputElement).checked =
      this.settings.showTrails;
    (document.getElementById("showParticles") as HTMLInputElement).checked =
      this.settings.showParticles;
    (document.getElementById("dayNightCycle") as HTMLInputElement).checked =
      this.settings.dayNightCycle;

    // Update value displays
    document.querySelectorAll('input[type="range"]').forEach((input) => {
      const target = input as HTMLInputElement;
      const valueSpan = target.parentElement?.querySelector(".setting-value");
      if (valueSpan) {
        valueSpan.textContent = target.value;
      }
    });
  }

  private applySettings(): void {
    this.settings.foodSpawnRate = parseInt(
      (document.getElementById("foodSpawnRate") as HTMLInputElement).value
    );
    this.settings.maxFood = parseInt(
      (document.getElementById("maxFood") as HTMLInputElement).value
    );
    this.settings.initialHerbivores = parseInt(
      (document.getElementById("initialHerbivores") as HTMLInputElement).value
    );
    this.settings.initialCarnivores = parseInt(
      (document.getElementById("initialCarnivores") as HTMLInputElement).value
    );
    this.settings.initialOmnivores = parseInt(
      (document.getElementById("initialOmnivores") as HTMLInputElement).value
    );
    this.settings.showTrails = (
      document.getElementById("showTrails") as HTMLInputElement
    ).checked;
    this.settings.showParticles = (
      document.getElementById("showParticles") as HTMLInputElement
    ).checked;
    this.settings.dayNightCycle = (
      document.getElementById("dayNightCycle") as HTMLInputElement
    ).checked;

    this.world?.applySettings(this.settings);
  }

  private resetSettings(): void {
    this.settings = {
      foodSpawnRate: 50,
      maxFood: 100,
      initialHerbivores: 25,
      initialCarnivores: 10,
      initialOmnivores: 15,
      showTrails: true,
      showParticles: true,
      dayNightCycle: true,
    };
    this.populateSettings();
  }

  updateStats(stats: Stats): void {
    this.safeUpdateElement("herbivoreCount", stats.herbivoreCount.toString());
    this.safeUpdateElement("carnivoreCount", stats.carnivoreCount.toString());
    this.safeUpdateElement("omnivoreCount", stats.omnivoreCount.toString());
    this.safeUpdateElement("totalPopulation", stats.totalPopulation.toString());
    this.safeUpdateElement("foodCount", stats.foodCount.toString());
    this.safeUpdateElement("averageAge", Math.floor(stats.averageAge).toString());
    this.safeUpdateElement("averageEnergy", Math.floor(stats.averageEnergy).toString());
    this.safeUpdateElement("birthCount", stats.reproductionEvents.toString());
    this.safeUpdateElement("deathCount", stats.deathEvents.toString());
    this.safeUpdateElement("mutationCount", stats.reproductionEvents.toString());
  }

  private safeUpdateElement(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  }

  selectOrganism(organism: Organism | null): void {
    this.selectedOrganism = organism;
    this.updateInspector();
  }

  private updateInspector(): void {
    const inspectorContent = document.getElementById("inspectorContent");
    if (!inspectorContent) return;

    if (!this.selectedOrganism) {
      inspectorContent.innerHTML = `
        <div class="inspector-placeholder">
          <i class="fas fa-mouse-pointer"></i>
          <p>Click on an organism to inspect its genetics and behavior</p>
        </div>
      `;
      return;
    }

    const organism = this.selectedOrganism;
    const healthPercentage = (organism.energy / organism.maxEnergy) * 100;
    const agePercentage = (organism.age / organism.dna.lifespan) * 100;

    inspectorContent.innerHTML = `
      <div class="organism-details">
        <div class="organism-header">
          <div class="organism-icon">
            <div class="pop-color ${organism.species}"></div>
          </div>
          <div class="organism-info">
            <h4>${
              organism.species.charAt(0).toUpperCase() +
              organism.species.slice(1)
            }</h4>
            <p>Age: ${organism.age} / ${organism.dna.lifespan}</p>
          </div>
        </div>
        
        <div class="health-bar">
          <label>Energy: ${Math.floor(organism.energy)}/${
      organism.maxEnergy
    }</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${healthPercentage}%; background: ${
      healthPercentage > 50
        ? "#4CAF50"
        : healthPercentage > 25
        ? "#FF9800"
        : "#F44336"
    }"></div>
          </div>
        </div>
        
        <div class="age-bar">
          <label>Lifespan Progress</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${agePercentage}%; background: #00d4aa"></div>
          </div>
        </div>
        
        <div class="genetics-section">
          <h5><i class="fas fa-dna"></i> Genetics</h5>
          <div class="gene-grid">
            <div class="gene-item">
              <span class="gene-label">Speed</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  (organism.dna.speed / 2) * 100
                }%"></div>
              </div>
              <span class="gene-value">${organism.dna.speed.toFixed(2)}</span>
            </div>
            <div class="gene-item">
              <span class="gene-label">Efficiency</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  (organism.dna.efficiency / 2) * 100
                }%"></div>
              </div>
              <span class="gene-value">${organism.dna.efficiency.toFixed(
                2
              )}</span>
            </div>
            <div class="gene-item">
              <span class="gene-label">Aggression</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  organism.dna.aggression * 100
                }%"></div>
              </div>
              <span class="gene-value">${organism.dna.aggression.toFixed(
                2
              )}</span>
            </div>
            <div class="gene-item">
              <span class="gene-label">Size</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  ((organism.dna.size - 0.5) / 1) * 100
                }%"></div>
              </div>
              <span class="gene-value">${organism.dna.size.toFixed(2)}</span>
            </div>
            <div class="gene-item">
              <span class="gene-label">Socialness</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  organism.dna.socialness * 100
                }%"></div>
              </div>
              <span class="gene-value">${organism.dna.socialness.toFixed(
                2
              )}</span>
            </div>
            <div class="gene-item">
              <span class="gene-label">Reproduction</span>
              <div class="gene-bar">
                <div class="gene-fill" style="width: ${
                  ((organism.dna.reproductionThreshold - 40) / 80) * 100
                }%"></div>
              </div>
              <span class="gene-value">${Math.floor(
                organism.dna.reproductionThreshold
              )}</span>
            </div>
          </div>
        </div>
        
        <div class="behavior-section">
          <h5><i class="fas fa-brain"></i> Current Behavior</h5>
          <div class="behavior-info">
            <p><strong>Target:</strong> ${
              organism.targetX ? "Hunting/Foraging" : "Wandering"
            }</p>
            <p><strong>Can Reproduce:</strong> ${
              organism.canReproduce() ? "Yes" : "No"
            }</p>
            <p><strong>Cooldown:</strong> ${organism.reproductionCooldown}</p>
          </div>
        </div>
      </div>
    `;
  }

  getSettings(): SimulationSettings {
    return this.settings;
  }
}

class World {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  organisms: Organism[] = [];
  food: Food[] = [];
  obstacles: Obstacle[] = [];
  particles: Particle[] = [];
  ui: UIManager;
  enhancedStatsManager: EnhancedStatsManager;

  // Simulation state
  foodSpawnTimer: number = 0;
  time: number = 0;
  paused: boolean = false;
  speed: number = 1;
  startTime: number = 0;

  // Statistics
  stats: Stats = {
    herbivoreCount: 0,
    carnivoreCount: 0,
    omnivoreCount: 0,
    totalPopulation: 0,
    averageAge: 0,
    averageEnergy: 0,
    foodCount: 0,
    reproductionEvents: 0,
    deathEvents: 0,
    generationTime: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ui = new UIManager();
    this.ui.setWorld(this);
    this.enhancedStatsManager = new EnhancedStatsManager();
    this.startTime = Date.now();

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Initialize simulation
    this.setupInitialPopulation();
    this.createObstacles();
    this.spawnFood(40);

    // Setup controls and interactions
    this.setupEventListeners();
  }

  resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupInitialPopulation(): void {
    // Create diverse initial population
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * (this.canvas.width - 40) + 20;
      const y = Math.random() * (this.canvas.height - 40) + 20;
      this.organisms.push(new Organism(x, y, SpeciesType.HERBIVORE));
    }

    for (let i = 0; i < 15; i++) {
      const x = Math.random() * (this.canvas.width - 40) + 20;
      const y = Math.random() * (this.canvas.height - 40) + 20;
      this.organisms.push(new Organism(x, y, SpeciesType.OMNIVORE));
    }

    for (let i = 0; i < 10; i++) {
      const x = Math.random() * (this.canvas.width - 40) + 20;
      const y = Math.random() * (this.canvas.height - 40) + 20;
      this.organisms.push(new Organism(x, y, SpeciesType.CARNIVORE));
    }
  }

  createObstacles(): void {
    // Create some random obstacles
    const obstacleCount = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < obstacleCount; i++) {
      this.obstacles.push({
        x: Math.random() * (this.canvas.width - 100) + 50,
        y: Math.random() * (this.canvas.height - 100) + 50,
        width: 30 + Math.random() * 70,
        height: 30 + Math.random() * 70,
      });
    }
  }

  spawnFood(count: number): void {
    for (let i = 0; i < count; i++) {
      let x,
        y,
        attempts = 0;

      // Try to spawn food away from obstacles
      do {
        x = Math.random() * (this.canvas.width - 20) + 10;
        y = Math.random() * (this.canvas.height - 20) + 10;
        attempts++;
      } while (attempts < 10 && this.isPointInObstacle(x, y));

      this.food.push(new Food(x, y));
    }
  }

  isPointInObstacle(x: number, y: number): boolean {
    return this.obstacles.some(
      (obstacle) =>
        x >= obstacle.x &&
        x <= obstacle.x + obstacle.width &&
        y >= obstacle.y &&
        y <= obstacle.y + obstacle.height
    );
  }

  setupEventListeners(): void {
    // Click to add items based on current action
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!this.isPointInObstacle(x, y)) {
        const action = this.ui.getCurrentAction();

        switch (action) {
          case "food":
            this.food.push(new Food(x, y));
            this.createParticleEffect(x, y, "#00ff00", "food_spawn");
            break;
          case "herbivore":
            this.organisms.push(new Organism(x, y, SpeciesType.HERBIVORE));
            this.createParticleEffect(x, y, "#4CAF50", "birth");
            break;
          case "carnivore":
            this.organisms.push(new Organism(x, y, SpeciesType.CARNIVORE));
            this.createParticleEffect(x, y, "#F44336", "birth");
            break;
          case "omnivore":
            this.organisms.push(new Organism(x, y, SpeciesType.OMNIVORE));
            this.createParticleEffect(x, y, "#FF9800", "birth");
            break;
        }
      }
    });

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ": // Space to pause
          this.paused = !this.paused;
          e.preventDefault();
          break;
        case "1":
          this.speed = 0.5;
          break;
        case "2":
          this.speed = 1;
          break;
        case "3":
          this.speed = 2;
          break;
        case "4":
          this.speed = 4;
          break;
        case "f":
        case "F":
          this.ui.selectAction("food");
          break;
        case "h":
        case "H":
          this.ui.selectAction("herbivore");
          break;
        case "c":
        case "C":
          this.ui.selectAction("carnivore");
          break;
        case "o":
        case "O":
          this.ui.selectAction("omnivore");
          break;
      }
    });
  }

  createParticleEffect(
    x: number,
    y: number,
    color: string,
    type: string
  ): void {
    const particleCount = type === "death" ? 8 : 4;

    for (let i = 0; i < particleCount; i++) {
      const angle = ((Math.PI * 2) / particleCount) * i + Math.random() * 0.5;
      const speed = 1 + Math.random() * 3;

      this.particles.push({
        x: x,
        y: y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: type === "death" ? 4 : 2,
      });
    }
  }

  updateStats(): void {
    let herbivores = 0,
      carnivores = 0,
      omnivores = 0;
    let totalAge = 0,
      totalEnergy = 0;

    for (const organism of this.organisms) {
      switch (organism.species) {
        case SpeciesType.HERBIVORE:
          herbivores++;
          break;
        case SpeciesType.CARNIVORE:
          carnivores++;
          break;
        case SpeciesType.OMNIVORE:
          omnivores++;
          break;
      }
      totalAge += organism.age;
      totalEnergy += organism.energy;
    }

    this.stats.herbivoreCount = herbivores;
    this.stats.carnivoreCount = carnivores;
    this.stats.omnivoreCount = omnivores;
    this.stats.totalPopulation = this.organisms.length;
    this.stats.averageAge =
      this.organisms.length > 0 ? totalAge / this.organisms.length : 0;
    this.stats.averageEnergy =
      this.organisms.length > 0 ? totalEnergy / this.organisms.length : 0;
    this.stats.foodCount = this.food.length;
  }

  update(): void {
    if (this.paused) return;

    for (let tick = 0; tick < this.speed; tick++) {
      this.time++;

      // Update organisms
      for (let i = this.organisms.length - 1; i >= 0; i--) {
        const organism = this.organisms[i];

        // AI and movement update
        organism.updateAI(this.organisms, this.food);
        organism.update(this.canvas.width, this.canvas.height, this.obstacles);

        // Food consumption
        for (let j = this.food.length - 1; j >= 0; j--) {
          if (organism.isCollidingWith(this.food[j])) {
            if (organism.species !== SpeciesType.CARNIVORE) {
              organism.energy += this.food[j].energy;
              organism.energy = Math.min(organism.energy, organism.maxEnergy);
              this.createParticleEffect(
                this.food[j].x,
                this.food[j].y,
                "#00ff00",
                "eat"
              );
              this.food.splice(j, 1);
            }
          }
        }

        // Predation (carnivores and aggressive omnivores)
        if (
          organism.species === SpeciesType.CARNIVORE ||
          (organism.species === SpeciesType.OMNIVORE &&
            organism.dna.aggression > 0.6)
        ) {
          for (let j = this.organisms.length - 1; j >= 0; j--) {
            const prey = this.organisms[j];
            if (prey !== organism && organism.isCollidingWith(prey)) {
              // Only hunt smaller or weaker organisms
              if (
                (prey.species === SpeciesType.HERBIVORE ||
                  prey.getRadius() < organism.getRadius() * 0.8) &&
                organism.energy > prey.energy
              ) {
                const energyGain = Math.min(
                  prey.energy * 0.7,
                  organism.maxEnergy - organism.energy
                );
                organism.energy += energyGain;

                this.createParticleEffect(prey.x, prey.y, "#ff0000", "death");
                this.organisms.splice(j, 1);
                this.stats.deathEvents++;

                if (i > j) i--; // Adjust index if we removed an organism before current
                break;
              }
            }
          }
        }

        // Reproduction
        if (organism.canReproduce()) {
          // Find potential mate of same species nearby
          const potentialMates = this.organisms.filter(
            (other) =>
              other !== organism &&
              other.species === organism.species &&
              other.canReproduce() &&
              organism.distanceTo(other.x, other.y) < 50
          );

          if (potentialMates.length > 0 || Math.random() < 0.1) {
            // Sexual or asexual reproduction
            const mate =
              potentialMates.length > 0 ? potentialMates[0] : undefined;
            const child = organism.reproduce(mate);

            // Ensure child spawns in valid location
            if (
              !this.isPointInObstacle(child.x, child.y) &&
              child.x >= 0 &&
              child.x <= this.canvas.width &&
              child.y >= 0 &&
              child.y <= this.canvas.height
            ) {
              this.organisms.push(child);
              this.createParticleEffect(
                child.x,
                child.y,
                organism.getSpeciesColor(),
                "birth"
              );
              this.stats.reproductionEvents++;
            }
          }
        }

        // Death
        if (organism.isDead()) {
          this.createParticleEffect(organism.x, organism.y, "#666666", "death");
          this.organisms.splice(i, 1);
          this.stats.deathEvents++;
        }
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life -= 0.02;

        if (particle.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Spawn food periodically
      this.foodSpawnTimer++;
      if (this.foodSpawnTimer > 80 && this.food.length < 100) {
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        this.spawnFood(spawnCount);
        this.foodSpawnTimer = 0;
      }
    }

    // Update statistics
    this.updateStats();
    this.stats.generationTime = Date.now() - this.startTime;

    // Update UI with new stats
    this.ui.updateStats(this.stats);

    // Update enhanced stats panel
    this.enhancedStatsManager.updateEnhancedStats(
      this.organisms,
      this.food,
      this
    );
  }

  getDayNightColor(): string {
    // 24-hour cycle over 7200 ticks (2 minutes real time at 60fps)
    const cyclePosition = (this.time % 7200) / 7200;
    const dayPhase = Math.sin(cyclePosition * Math.PI * 2);

    if (dayPhase > 0) {
      // Day time - lighter background
      const intensity = Math.floor(18 + dayPhase * 15);
      return `rgb(${intensity}, ${intensity}, ${intensity + 2})`;
    } else {
      // Night time - darker background
      const intensity = Math.floor(18 + dayPhase * 8);
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    }
  }

  draw(): void {
    // Clear canvas with day/night cycle background
    this.ctx.fillStyle = this.getDayNightColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Debug logging
    if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
      console.log("Drawing frame:", {
        canvasSize: `${this.canvas.width}x${this.canvas.height}`,
        organisms: this.organisms.length,
        food: this.food.length,
        backgroundColor: this.getDayNightColor()
      });
    }

    // Draw obstacles
    this.ctx.fillStyle = "#444444";
    for (const obstacle of this.obstacles) {
      this.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    }

    // Draw particles
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.life;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;

    // Draw food
    for (const food of this.food) {
      food.draw(this.ctx);
    }

    // Draw organisms
    for (const organism of this.organisms) {
      organism.draw(this.ctx);
    }
  }

  reset(): void {
    this.organisms = [];
    this.food = [];
    this.particles = [];
    this.stats.reproductionEvents = 0;
    this.stats.deathEvents = 0;
    this.startTime = Date.now();
    this.time = 0;
    this.ui.selectOrganism(null);

    // Recreate initial population
    this.setupInitialPopulation();
    this.spawnFood(40);
  }

  applySettings(settings: SimulationSettings): void {
    // Apply new settings by updating simulation parameters
    const maxFood = document.getElementById("maxFood") as HTMLInputElement;
    if (maxFood) {
      // Update food spawn parameters based on settings
      this.spawnFood(Math.min(settings.maxFood - this.food.length, 20));
    }
  }
}

function main(): void {
  console.log("=== Primordial Soup Debug ===");
  console.log("DOM loaded, initializing...");
  
  // Add a small delay to ensure everything is ready
  setTimeout(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }
    
    console.log("Canvas found:", canvas);
    console.log("Canvas client dimensions:", canvas.clientWidth, "x", canvas.clientHeight);
    console.log("Canvas actual dimensions:", canvas.width, "x", canvas.height);

    const world = new World(canvas);
    console.log("World created, organisms count:", world.organisms.length);
    console.log("Food count:", world.food.length);

    function animate(): void {
      world.update();
      world.draw();
      requestAnimationFrame(animate);
    }

    animate();
    console.log("Animation loop started");
  }, 100); // 100ms delay
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', main);
