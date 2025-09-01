import type { DNA, Trail, Obstacle } from "./types";
import { SpeciesType } from "./types";
import { Food } from "./food";

// Advanced organism with genetics, AI, and complex behaviors
export class Organism {
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