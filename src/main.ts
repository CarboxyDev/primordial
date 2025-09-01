import "./style.css";
import "./override.css";
import { World } from "./world";

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
    console.log(
      "Canvas client dimensions:",
      canvas.clientWidth,
      "x",
      canvas.clientHeight
    );
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
document.addEventListener("DOMContentLoaded", main);
