# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Primordial Soup is an advanced evolution simulator built with TypeScript and Vite. It features organisms with genetic DNA systems, AI-driven behaviors, reproduction with inheritance/mutation, and real-time ecosystem dynamics.

## Development Commands

```bash
# Development server with hot reload
pnpm dev

# Production build (compiles TypeScript then builds)
pnpm run build

# Preview production build
pnpm run preview
```

## Technology Stack

- **Build System**: Vite with TypeScript support
- **Package Manager**: pnpm (note: not npm - use pnpm commands)
- **Language**: TypeScript with strict mode enabled
- **Canvas**: HTML5 Canvas API for rendering
- **UI**: Native HTML/CSS with Font Awesome icons

## Key Architecture

### Core Classes

- `Organism`: Main entity with DNA, AI behaviors, reproduction, aging, and species (herbivore/carnivore/omnivore)
- `World`: Simulation manager handling updates, rendering, stats, and ecosystem management
- `UIManager`: Interface controls, settings, and user interactions
- `EnhancedStatsManager`: Real-time statistics and performance monitoring

### Genetic System

- `DNA` interface defines inherited traits: speed, efficiency, aggression, size, reproduction threshold, lifespan, socialness
- Sexual/asexual reproduction with genetic mixing and random mutations
- Natural selection through energy management and predator-prey dynamics

### AI Behaviors

- Pathfinding to food sources and prey
- Flocking behavior for social organisms
- Predator-prey relationships based on species and aggression traits
- Obstacle avoidance and environmental navigation

### Visual Features

- Particle effects for births, deaths, and eating
- Trail systems showing organism movement history
- Day/night cycles affecting background colors
- Real-time stats dashboard with population tracking

## Code Style Notes

- Uses ES2022 target with modern TypeScript features
- Strict TypeScript configuration with unused parameter/local checking
- Canvas rendering with 2D context
- Event-driven architecture for UI interactions
- Modular class-based design with clear separation of concerns

## Development Tips

- The simulation runs at variable speeds (0.5x to 4x) controllable via UI
- Statistics are updated every frame and tracked over time
- All major simulation parameters are configurable through settings modal
- Canvas auto-resizes to window dimensions on resize events
- Extensive debug logging available (check browser console)

## File Organization

- `src/main.ts`: Complete simulation engine (all classes in single file)
- `src/counter.ts`: Unused Vite template file (can be removed)
- `index.html`: Main HTML with embedded UI structure
- `src/style.css` + `src/override.css`: Styling
- `FUTURE_IMPROVEMENTS.md`: Detailed roadmap of planned enhancements
