import * as THREE from "three";
import { GUI } from "dat.gui";

// ---------------------- Szene, Kamera, Renderer ----------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------------------- Hintergrund (Bleistift-Stil) ----------------------
const BackgroundShader = {
  uniforms: {
    time: { value: 0 },
    audioReaction: { value: 0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float audioReaction;
    varying vec2 vUv;
    
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
    }
    
    void main() {
      float wave = sin(vUv.x * 10.0 + time * audioReaction) * 0.05;
      vec2 uv = vec2(vUv.x, vUv.y + wave);
      float noise = random(uv * time) * 0.1;
      float baseColor = uv.y + noise;
      baseColor = mix(0.7, baseColor, uv.y);
      gl_FragColor = vec4(vec3(baseColor), 1.0);
    }
  `,
};

const backgroundMaterial = new THREE.ShaderMaterial(BackgroundShader);
const backgroundPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  backgroundMaterial
);
backgroundPlane.position.z = -5;
scene.add(backgroundPlane);

// ---------------------- Audio Setup (Stereo) ----------------------
const audio = new Audio();
audio.controls = true;
document.body.appendChild(audio);

const audioContext = new AudioContext();
const splitter = audioContext.createChannelSplitter(2);

const analyserLeft = audioContext.createAnalyser();
const analyserRight = audioContext.createAnalyser();
analyserLeft.fftSize = 2048;
analyserRight.fftSize = 2048;

const bufferLength = analyserLeft.fftSize;
const dataLeft = new Uint8Array(bufferLength);
const dataRight = new Uint8Array(bufferLength);

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".mp3, .wav";
document.body.appendChild(fileInput);

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const objectURL = URL.createObjectURL(file);
    audio.src = objectURL;
    audio.play().then(() => {
      const source = audioContext.createMediaElementSource(audio);
      source.connect(splitter);
      splitter.connect(analyserLeft, 0);
      splitter.connect(analyserRight, 1);
      splitter.connect(audioContext.destination, 0);
      splitter.connect(audioContext.destination, 1);
    });
  }
});

// ---------------------- Parameter & dat.GUI ----------------------
const params = {
  color: 0xffffff, // Hauptfarbe (Weiß)
  size: 0.01, // Basisgröße für reguläre Punkte
  quantizedSize: 0.03, // Größe der quantisierten (Raster-) Punkte
  quantizeGrid: 0.05, // Rastergröße für Quantisierung
  alwaysShowQuantized: false, // Wenn true, werden alle quantisierten Punkte angezeigt
  quantizeProbability: 0.5, // Wahrscheinlichkeit, dass ein Datenpunkt als quantisiert betrachtet wird
  gridFillProbability: 0.001, // Wahrscheinlichkeit, dass ein eindeutiger Gitterplatz befüllt wird
  shadowBlurStop: 0.7, // Steuerung für den Blur im Schatten
};

const gui = new GUI();
gui.addColor(params, "color").onChange((val) => {
  regularMaterial.color.set(val);
  quantizedMaterial.color.set(val);
});
gui
  .add(params, "size", 0.001, 0.05, 0.001)
  .name("Regular Size")
  .onChange((val) => {
    regularMaterial.size = val;
  });
gui
  .add(params, "quantizedSize", 0.001, 0.1, 0.001)
  .name("Quantized Size")
  .onChange((val) => {
    quantizedMaterial.size = val;
  });
gui.add(params, "quantizeGrid", 0.001, 0.2, 0.001).name("Grid Size");
gui.add(params, "quantizeProbability", 0, 1, 0.01).name("Quantize Prob.");
gui.add(params, "gridFillProbability", 0, 1, 0.01).name("Grid Fill Prob.");
gui.add(params, "alwaysShowQuantized").name("Always Show Quantized");
gui
  .add(params, "shadowBlurStop", 0.1, 1, 0.01)
  .name("Shadow Blur Stop")
  .onChange((val) => {
    shadowTexture = createBlurTexture(val);
    regularShadowMaterial.map = shadowTexture;
    regularShadowMaterial.needsUpdate = true;
  });

// ---------------------- Materialien für Hauptpunkte ----------------------
const regularMaterial = new THREE.PointsMaterial({
  color: params.color,
  size: params.size,
});
const quantizedMaterial = new THREE.PointsMaterial({
  color: params.color,
  size: params.quantizedSize,
});

// ---------------------- Geometrien & Punktobjekte ----------------------
// Wir erstellen die Hauptgeometrien dynamisch im Animationsloop.
// Hier initialisieren wir leere Arrays, die maximal bufferLength Punkte enthalten.
let regularArrayBuffer = new Float32Array(0);
let quantizedArrayBuffer = new Float32Array(0);
const regularGeometry = new THREE.BufferGeometry();
const quantizedGeometry = new THREE.BufferGeometry();

const regularPoints = new THREE.Points(regularGeometry, regularMaterial);
const quantizedPoints = new THREE.Points(quantizedGeometry, quantizedMaterial);
regularPoints.renderOrder = 1;
quantizedPoints.renderOrder = 2;
scene.add(regularPoints);
scene.add(quantizedPoints);

// ---------------------- Schattenkopien ----------------------
// Separate Geometrien für die Schattenkopien
let regularShadowBuffer = new Float32Array(0);
let quantizedShadowBuffer = new Float32Array(0);
const regularShadowGeometry = new THREE.BufferGeometry();
const quantizedShadowGeometry = new THREE.BufferGeometry();

// ---------------------- Texturen für Schatten ----------------------
function createBlurTexture(stop = params.shadowBlurStop) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(stop, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createSquareTexture() {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

let shadowTexture = createBlurTexture(params.shadowBlurStop);
const regularShadowMaterial = new THREE.PointsMaterial({
  color: 0x000000,
  size: params.size,
  map: shadowTexture,
  transparent: true,
  opacity: 0.4,
  depthTest: true,
  depthWrite: false,
});
const quantizedShadowMaterial = new THREE.PointsMaterial({
  color: 0x000000,
  size: params.quantizedSize,
  map: createSquareTexture(), // Quadrat-Textur
  transparent: true,
  opacity: 0.4,
  depthTest: true,
  depthWrite: false,
});

const regularShadowPoints = new THREE.Points(
  regularShadowGeometry,
  regularShadowMaterial
);
const quantizedShadowPoints = new THREE.Points(
  quantizedShadowGeometry,
  quantizedShadowMaterial
);
regularShadowPoints.renderOrder = 0;
quantizedShadowPoints.renderOrder = 0;
scene.add(regularShadowPoints);
scene.add(quantizedShadowPoints);

// Feste Parameter für die Schattenprojektion (Boden)
const fixedShadowY = -1.5; // Bodenhöhe (Y)
const fixedShadowZOffset = -2.0; // Verschiebung in Z

// ---------------------- Animation / Render-Loop ----------------------
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;
  backgroundMaterial.uniforms.time.value = time;

  analyserLeft.getByteTimeDomainData(dataLeft);
  analyserRight.getByteTimeDomainData(dataRight);

  // Erstelle dynamisch Arrays für reguläre und quantisierte Punkte
  const regularArray = [];
  const quantizedArray = [];
  for (let i = 0; i < bufferLength; i++) {
    const xVal = (dataLeft[i] - 128) / 128;
    const yVal = (dataRight[i] - 128) / 128;
    if (Math.random() < params.quantizeProbability) {
      // Quantisierte Punkte: Rasterung anwenden
      const qx = Math.floor(xVal / params.quantizeGrid) * params.quantizeGrid;
      const qy = Math.floor(yVal / params.quantizeGrid) * params.quantizeGrid;
      // Hier entscheidet gridFillProbability, ob dieser Gitterplatz gefüllt wird
      if (
        params.alwaysShowQuantized ||
        Math.random() < params.gridFillProbability
      ) {
        quantizedArray.push(qx, qy, 0);
      }
    } else {
      regularArray.push(xVal, yVal, 0);
    }
  }

  // Aktualisiere Geometrien
  regularGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(regularArray), 3)
  );
  quantizedGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(quantizedArray), 3)
  );

  // Schattenprojektion für reguläre Punkte:
  const regShadow = [];
  for (let j = 0; j < regularArray.length / 3; j++) {
    const baseX = regularArray[j * 3 + 0];
    const baseY = regularArray[j * 3 + 1];
    regShadow.push(baseX, fixedShadowY, -baseY + fixedShadowZOffset);
  }
  regularShadowGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(regShadow), 3)
  );

  // Schattenprojektion für quantisierte Punkte:
  const quantShadow = [];
  for (let j = 0; j < quantizedArray.length / 3; j++) {
    const baseX = quantizedArray[j * 3 + 0];
    const baseY = quantizedArray[j * 3 + 1];
    quantShadow.push(baseX, fixedShadowY, -baseY + fixedShadowZOffset);
  }
  quantizedShadowGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(quantShadow), 3)
  );

  // Hintergrund: Leichte Audio-Reaktion (linker Kanal)
  const avgLeft = dataLeft.reduce((sum, val) => sum + val, 0) / dataLeft.length;
  const reaction = Math.abs(avgLeft - 128) / 128;
  backgroundMaterial.uniforms.audioReaction.value = reaction * 0.25;

  renderer.render(scene, camera);
}

animate();
