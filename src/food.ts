export class Food {
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
