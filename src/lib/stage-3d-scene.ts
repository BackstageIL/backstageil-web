/**
 * The 3D stage view (three.js). Loaded only when a visitor opens it (dynamic import from
 * Stage3D.tsx), so three.js never weighs on the hall page itself. Draws a StageModel to scale:
 * stage floor with a 1 m grid and centre line, proscenium line, grid level with its battens,
 * FOH position in the house, and a 1.8 m figure for scale. Colors come from the site's theme.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import type { StageModel } from "./stage-model";

export interface SceneLabels {
  width: string;
  depth: string;
  grid: string | null;
  upstage: string;
  house: string;
  foh: string | null;
  figure: string;
}

export interface MountedStage {
  reset: () => void;
  dispose: () => void;
}

const FLOOR_THICKNESS = 0.15;
const FIGURE_HEIGHT = 1.8;

function themeColor(name: string, fallback: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

function line(points: THREE.Vector3[], color: THREE.Color, opacity = 1): THREE.Line {
  const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
}

function label(text: string, position: THREE.Vector3, className = "stage3d-label"): CSS2DObject {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  element.dir = "auto";
  const object = new CSS2DObject(element);
  object.position.copy(position);
  return object;
}

export function mountStage(
  container: HTMLElement,
  model: StageModel,
  labels: SceneLabels,
): MountedStage {
  const colors = {
    floor: themeColor("--plan-floor", "#e7ebf0"),
    ink: themeColor("--ink", "#1a2233"),
    muted: themeColor("--muted", "#5b6577"),
    rule: themeColor("--rule", "#d5dae1"),
    cue: themeColor("--cue", "#2348c4"),
    spike: themeColor("--spike", "#e8b400"),
  };
  const { width, depth } = model;
  const halfWidth = width / 2;
  const top = model.grid ?? Math.max(4, depth / 2);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-width, top * 2, -depth);
  scene.add(sun);

  // Stage floor (a slab; its top is y = 0) with a 1 m grid, outline and centre line
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(width, FLOOR_THICKNESS, depth),
    new THREE.MeshStandardMaterial({ color: colors.floor, roughness: 0.9 }),
  );
  floor.position.set(0, -FLOOR_THICKNESS / 2, depth / 2);
  scene.add(floor);
  for (let x = 1; x < width; x += 1) {
    scene.add(
      line(
        [
          new THREE.Vector3(x - halfWidth, 0.002, 0),
          new THREE.Vector3(x - halfWidth, 0.002, depth),
        ],
        colors.rule,
      ),
    );
  }
  for (let z = 1; z < depth; z += 1) {
    scene.add(
      line(
        [new THREE.Vector3(-halfWidth, 0.002, z), new THREE.Vector3(halfWidth, 0.002, z)],
        colors.rule,
      ),
    );
  }
  const corners = [
    new THREE.Vector3(-halfWidth, 0.004, 0),
    new THREE.Vector3(halfWidth, 0.004, 0),
    new THREE.Vector3(halfWidth, 0.004, depth),
    new THREE.Vector3(-halfWidth, 0.004, depth),
    new THREE.Vector3(-halfWidth, 0.004, 0),
  ];
  scene.add(line(corners, colors.ink));
  scene.add(
    line([new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(0, 0.004, depth)], colors.muted),
  );
  const spike = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.01, 0.3),
    new THREE.MeshBasicMaterial({ color: colors.spike }),
  );
  spike.position.set(0, 0.005, 0.15);
  scene.add(spike);

  // Proscenium opening, on the floor at the downstage edge (its height isn't recorded)
  if (model.proscenium !== null) {
    const half = model.proscenium / 2;
    scene.add(
      line([new THREE.Vector3(-half, 0.01, 0), new THREE.Vector3(half, 0.01, 0)], colors.cue),
    );
  }

  // Grid level: a frame at the grid height, posts at the corners, and the battens
  if (model.grid !== null) {
    const y = model.grid;
    scene.add(
      line(
        corners.map((c) => new THREE.Vector3(c.x, y, c.z)),
        colors.muted,
        0.8,
      ),
    );
    for (const c of corners.slice(0, 4)) {
      scene.add(
        line([new THREE.Vector3(c.x, 0, c.z), new THREE.Vector3(c.x, y, c.z)], colors.rule, 0.7),
      );
    }
    const battenMaterial = new THREE.MeshStandardMaterial({
      color: colors.cue,
      metalness: 0.4,
      roughness: 0.5,
    });
    for (const z of model.battens) {
      const batten = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, width, 8),
        battenMaterial,
      );
      batten.rotation.z = Math.PI / 2;
      batten.position.set(0, y - 0.3, z);
      scene.add(batten);
    }
    if (labels.grid) scene.add(label(labels.grid, new THREE.Vector3(halfWidth, y, depth)));
  }

  // FOH position in the house
  if (model.foh !== null) {
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 1),
      new THREE.MeshStandardMaterial({ color: colors.muted }),
    );
    desk.position.set(0, 0.5 - 1, model.foh);
    scene.add(desk);
    if (labels.foh) scene.add(label(labels.foh, new THREE.Vector3(0, 0.6, model.foh)));
  }

  // A 1.8 m figure at centre stage, for scale
  const figureMaterial = new THREE.MeshStandardMaterial({ color: colors.spike });
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, FIGURE_HEIGHT - 0.65, 4, 8),
    figureMaterial,
  );
  body.position.set(0, (FIGURE_HEIGHT - 0.25) / 2, depth / 2);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), figureMaterial);
  head.position.set(0, FIGURE_HEIGHT - 0.12, depth / 2);
  scene.add(body, head);

  // Dimension and orientation labels
  scene.add(label(labels.width, new THREE.Vector3(-halfWidth * 0.55, 0.05, -0.35)));
  scene.add(label(labels.depth, new THREE.Vector3(halfWidth + 0.5, 0.05, depth / 2)));
  scene.add(label(labels.upstage, new THREE.Vector3(0, 0.05, depth + 0.6), "stage3d-label muted"));
  scene.add(
    label(
      labels.house,
      new THREE.Vector3(0, 0.05, -Math.max(2.5, depth * 0.3)),
      "stage3d-label muted",
    ),
  );

  // Camera in the front rows of the house, a little off centre, looking up into the stage
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  const span = Math.max(width, depth);
  const target = new THREE.Vector3(0, model.grid !== null ? top * 0.32 : 0.5, depth * 0.55);
  const home = new THREE.Vector3(width * 0.32, Math.max(span * 0.35, top * 0.42), -span * 0.72);
  camera.position.copy(home);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "stage3d-labels";
  container.append(labelRenderer.domElement);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = !reducedMotion;
  controls.maxPolarAngle = Math.PI * 0.49; // stay above the floor
  controls.minDistance = 2;
  controls.maxDistance = Math.max(width, depth, top) * 4;
  controls.listenToKeyEvents(container);
  controls.update();

  const resize = () => {
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    labelRenderer.setSize(clientWidth, clientHeight);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  });

  return {
    reset: () => {
      camera.position.copy(home);
      controls.target.copy(target);
      controls.update();
    },
    dispose: () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
    },
  };
}
