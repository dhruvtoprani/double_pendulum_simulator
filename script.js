const canvas = document.getElementById("pendulumCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 300; // leave space for control panel
canvas.height = window.innerHeight;



// State variables
let angle1 = Math.PI / 2;
let angle2 = Math.PI / 2;
let angle1_v = 0;
let angle2_v = 0;

let length1 = 200;
let length2 = 200;
let mass1 = 5;
let mass2 = 5;
let g = 9.8;

const dt = 0.05; // time step

const graphCanvas = document.getElementById("graphCanvas");
const graphCtx = graphCanvas.getContext("2d");
const graphWidth = graphCanvas.width;
const graphHeight = graphCanvas.height;
let angle1History = [];
let angle2History = [];
const maxPoints = graphWidth;


const energyCanvas = document.getElementById("energyCanvas");
const energyCtx = energyCanvas.getContext("2d");
const energyWidth = energyCanvas.width;
const energyHeight = energyCanvas.height;


let traceEnabled = false;
document.getElementById("traceToggle").addEventListener("change", (e) => {
  traceEnabled = e.target.checked;
});



function update() {
  // RK4 integration (simplified 2D double pendulum)
  let num1 = -g * (2 * mass1 + mass2) * Math.sin(angle1);
  let num2 = -mass2 * g * Math.sin(angle1 - 2 * angle2);
  let num3 = -2 * Math.sin(angle1 - angle2) * mass2;
  let num4 = angle2_v * angle2_v * length2 + angle1_v * angle1_v * length1 * Math.cos(angle1 - angle2);
  let denom = length1 * (2 * mass1 + mass2 - mass2 * Math.cos(2 * angle1 - 2 * angle2));
  let angle1_a = (num1 + num2 + num3 * num4) / denom;

  num1 = 2 * Math.sin(angle1 - angle2);
  num2 = angle1_v * angle1_v * length1 * (mass1 + mass2);
  num3 = g * (mass1 + mass2) * Math.cos(angle1);
  num4 = angle2_v * angle2_v * length2 * mass2 * Math.cos(angle1 - angle2);
  denom = length2 * (2 * mass1 + mass2 - mass2 * Math.cos(2 * angle1 - 2 * angle2));
  let angle2_a = (num1 * (num2 + num3 + num4)) / denom;

  angle1_v += angle1_a * dt;
  angle2_v += angle2_a * dt;
  angle1 += angle1_v * dt;
  angle2 += angle2_v * dt;
}

function draw() {
    if (traceEnabled) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
        
    const originX = canvas.width / 2;
    const originY = 150;
  
    const x1 = originX + length1 * Math.sin(angle1);
    const y1 = originY + length1 * Math.cos(angle1);
  
    const x2 = x1 + length2 * Math.sin(angle2);
    const y2 = y1 + length2 * Math.cos(angle2);
  
    // Arms
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  
    // Masses
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.arc(x1, y1, mass1 * 2, 0, 2 * Math.PI);
    ctx.fill();
  
    ctx.beginPath();
    ctx.arc(x2, y2, mass2 * 2, 0, 2 * Math.PI);
    ctx.fill();
  
    // Outputs
    document.getElementById("angle1").textContent = `Angle 1: ${angle1.toFixed(2)} rad`;
    document.getElementById("angle2").textContent = `Angle 2: ${angle2.toFixed(2)} rad`;
    const energy = 0.5 * mass1 * length1 * length1 * angle1_v * angle1_v +
                   0.5 * mass2 * (length1 * length1 * angle1_v * angle1_v +
                                  length2 * length2 * angle2_v * angle2_v +
                                  2 * length1 * length2 * angle1_v * angle2_v * Math.cos(angle1 - angle2)) -
                   (mass1 + mass2) * g * length1 * Math.cos(angle1) -
                   mass2 * g * length2 * Math.cos(angle2);
    document.getElementById("energy").textContent = `Total Energy: ${energy.toFixed(2)} J`;
  
    // Update angle history
    angle1History.push(angle1);
    angle2History.push(angle2);
    if (angle1History.length > maxPoints) {
      angle1History.shift();
      angle2History.shift();
    }
  
    // === ANGLE GRAPH ===
    graphCtx.clearRect(0, 0, graphWidth, graphHeight);
  
    graphCtx.beginPath();
    graphCtx.strokeStyle = "#00ffff";
    graphCtx.lineWidth = 2;
    for (let i = 0; i < angle1History.length; i++) {
      const y = graphHeight / 2 - angle1History[i] * 20;
      i === 0 ? graphCtx.moveTo(i, y) : graphCtx.lineTo(i, y);
    }
    graphCtx.stroke();
  
    graphCtx.beginPath();
    graphCtx.strokeStyle = "#ff66cc";
    graphCtx.lineWidth = 2;
    for (let i = 0; i < angle2History.length; i++) {
      const y = graphHeight / 2 - angle2History[i] * 20;
      i === 0 ? graphCtx.moveTo(i, y) : graphCtx.lineTo(i, y);
    }
    graphCtx.stroke();
  
    // === ENERGY BAR GRAPH ===
    const KE = 0.5 * mass1 * Math.pow(length1 * angle1_v, 2) +
               0.5 * mass2 * (Math.pow(length1 * angle1_v, 2) +
                             Math.pow(length2 * angle2_v, 2) +
                             2 * length1 * length2 * angle1_v * angle2_v * Math.cos(angle1 - angle2));
  
    const PE = (mass1 + mass2) * g * length1 * (1 - Math.cos(angle1)) +
               mass2 * g * length2 * (1 - Math.cos(angle2));
  
    const totalE = KE + PE;
    const scale = energyHeight / (totalE + 1e-6);
    const KEheight = KE * scale;
    const PEheight = PE * scale;
  
    energyCtx.clearRect(0, 0, energyWidth, energyHeight);
  
    // Kinetic Energy Bar
    energyCtx.fillStyle = "#e63946";
    energyCtx.fillRect(60, energyHeight - KEheight, 40, KEheight);
  
    // Potential Energy Bar
    energyCtx.fillStyle = "#1d8cf8";
    energyCtx.fillRect(160, energyHeight - PEheight, 40, PEheight);
  }
  
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

document.getElementById("length1").addEventListener("input", e => {
    length1 = +e.target.value;
  });
  document.getElementById("length2").addEventListener("input", e => {
    length2 = +e.target.value;
  });
  document.getElementById("mass1").addEventListener("input", e => {
    mass1 = +e.target.value;
  });
  document.getElementById("mass2").addEventListener("input", e => {
    mass2 = +e.target.value;
  });
  document.getElementById("gravity").addEventListener("input", e => {
    g = +e.target.value;
  });
  document.getElementById("reset").addEventListener("click", () => {
    angle1 = Math.PI / 2;
    angle2 = Math.PI / 2;
    angle1_v = 0;
    angle2_v = 0;
  });
  

  

  const startSimBtn = document.getElementById("startSim");
const introPopup = document.getElementById("introPopup");

startSimBtn.addEventListener("click", () => {
  introPopup.style.display = "none";
});
