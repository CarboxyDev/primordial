import type { Stats, Obstacle, Particle, SimulationSettings } from "./types";
import { SpeciesType } from "./types";
import { Organism } from "./organism";
import { Food } from "./food";
import { UIManager } from "./ui-manager";
import { EnhancedStatsManager } from "./stats-manager";

export class World {
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
    if (Math.random() < 0.01) {
      // Log 1% of the time to avoid spam
      console.log("Drawing frame:", {
        canvasSize: `${this.canvas.width}x${this.canvas.height}`,
        organisms: this.organisms.length,
        food: this.food.length,
        backgroundColor: this.getDayNightColor(),
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