// Advanced Primordial Soup Simulation
// Multiple species, genetics, AI, reproduction, and environmental interactions

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
}

class World {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  organisms: Organism[] = [];
  food: Food[] = [];
  obstacles: Obstacle[] = [];
  particles: Particle[] = [];

  // Simulation state
  foodSpawnTimer: number = 0;
  time: number = 0;
  paused: boolean = false;
  speed: number = 1;

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
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

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
    // Click to add food
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!this.isPointInObstacle(x, y)) {
        this.food.push(new Food(x, y));
        this.createParticleEffect(x, y, "#00ff00", "food_spawn");
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

    // Draw UI
    this.drawUI();
  }

  drawUI(): void {
    const padding = 15;
    const lineHeight = 18;
    let y = padding;

    // Semi-transparent background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(5, 5, 300, 200);

    // Text styling
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "14px monospace";

    // Population stats
    this.ctx.fillText(
      `Population: ${this.stats.totalPopulation}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillStyle = "#4CAF50";
    this.ctx.fillText(
      `  Herbivores: ${this.stats.herbivoreCount}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillStyle = "#FF9800";
    this.ctx.fillText(
      `  Omnivores: ${this.stats.omnivoreCount}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillStyle = "#F44336";
    this.ctx.fillText(
      `  Carnivores: ${this.stats.carnivoreCount}`,
      padding,
      (y += lineHeight)
    );

    // Other stats
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(
      `Food: ${this.stats.foodCount}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillText(
      `Avg Age: ${Math.floor(this.stats.averageAge)}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillText(
      `Avg Energy: ${Math.floor(this.stats.averageEnergy)}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillText(
      `Births: ${this.stats.reproductionEvents}`,
      padding,
      (y += lineHeight)
    );
    this.ctx.fillText(
      `Deaths: ${this.stats.deathEvents}`,
      padding,
      (y += lineHeight)
    );

    // Controls
    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(
      `Speed: ${this.speed}x ${this.paused ? "(PAUSED)" : ""}`,
      padding,
      (y += lineHeight + 5)
    );
    this.ctx.fillText(
      "Controls: SPACE=pause, 1-4=speed, click=add food",
      padding,
      (y += lineHeight)
    );
  }
}

// Initialize the advanced simulation
function main(): void {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  const world = new World(canvas);

  function animate(): void {
    world.update();
    world.draw();
    requestAnimationFrame(animate);
  }

  animate();
}

main();
