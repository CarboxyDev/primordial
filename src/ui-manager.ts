import type { SimulationSettings, ClickAction, Stats } from "./types";
import { Organism } from "./organism";

export class UIManager {
  private selectedOrganism: Organism | null = null;
  private settings: SimulationSettings;
  private world: any = null;
  private currentAction: ClickAction = "food";

  setWorld(world: any): void {
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
    this.safeUpdateElement(
      "averageAge",
      Math.floor(stats.averageAge).toString()
    );
    this.safeUpdateElement(
      "averageEnergy",
      Math.floor(stats.averageEnergy).toString()
    );
    this.safeUpdateElement("birthCount", stats.reproductionEvents.toString());
    this.safeUpdateElement("deathCount", stats.deathEvents.toString());
    this.safeUpdateElement(
      "mutationCount",
      stats.reproductionEvents.toString()
    );
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