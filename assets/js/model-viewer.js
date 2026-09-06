import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";
import { strFromU8, unzipSync } from "three/addons/libs/fflate.module.js";

const stage = document.querySelector("#model-stage");
const canvas = document.querySelector("#model-canvas");
const status = document.querySelector("#model-status");
const bodyPalette = document.querySelector("#body-color-palette");
const accentPalette = document.querySelector("#accent-color-palette");

if (bodyPalette && accentPalette) {
  accentPalette.querySelectorAll(".filament-swatch").forEach((swatch) => {
    const clone = swatch.cloneNode(true);
    const input = clone.querySelector("input");
    if (input) {
      input.name = "body-color";
      input.checked = input.value.toUpperCase() === "#373431";
    }
    bodyPalette.append(clone);
  });
}

const bodyInputs = Array.from(document.querySelectorAll('input[name="body-color"]'));
const accentInputs = Array.from(document.querySelectorAll('input[name="accent-color"]'));
const bodyCurrent = document.querySelector("#body-color-toggle .filament-current");
const accentCurrent = document.querySelector("#accent-color-toggle .filament-current");
const bodyToggle = document.querySelector("#body-color-toggle");
const accentToggle = document.querySelector("#accent-color-toggle");
const bodyName = document.querySelector("#body-color-name");
const accentName = document.querySelector("#accent-color-name");
const zoomOut = document.querySelector("#zoom-out");
const zoomIn = document.querySelector("#zoom-in");
const defaultModelUrl = new URL("../models/dab-block-01.preview.3mf", import.meta.url).href;
const blockColor = getComputedStyle(document.documentElement)
  .getPropertyValue("--block-color")
  .trim() || "#000000";

if (stage && canvas) {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    if (status) status.textContent = "3D preview unavailable";
    throw error;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
  const initialDistance = window.matchMedia("(max-width: 820px)").matches ? 2.5 : 5.8;
  camera.position.set(0, 0, initialDistance);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.touches.ONE = THREE.TOUCH.PAN;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  controls.minDistance = 2.5;
  controls.maxDistance = 8;
  controls.autoRotate = false;

  canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.85);
  fillLight.position.set(-4, 1.5, 3);
  scene.add(fillLight);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfcfcf, 1.25));

  const selectedBody = () => bodyInputs.find((input) => input.checked)?.value || blockColor;
  const selectedAccent = () => accentInputs.find((input) => input.checked)?.value || "#ffffff";
  const selectedColorName = (inputs) =>
    inputs.find((input) => input.checked)?.closest("label")?.title || "";
  const dispatchColorSelection = () => {
    const variantId = document.querySelector('input[name="hold-type"]:checked')?.value;
    const variant = window.DAB_STORE.product.variants.find((item) => item.id === variantId);
    const allowed = window.DAB_STORE.allowedAccentColors(
      selectedColorName(bodyInputs), variant?.accentColors || []
    );
    accentInputs.forEach((input) => {
      const label = input.closest("label");
      input.disabled = !allowed.includes(label?.title);
      if (label) label.hidden = input.disabled;
    });
    if (!allowed.includes(selectedColorName(accentInputs))) {
      const fallback = accentInputs.find((input) => !input.disabled);
      if (fallback) fallback.checked = true;
    }
    const selected = accentInputs.find((input) => input.checked);
    if (selected) {
      accentColor.set(selected.value);
      accentCurrent?.style.setProperty("--swatch-color", selected.value);
      if (accentName) accentName.textContent = selectedColorName(accentInputs);
      updateVertexColors();
    }
    window.dispatchEvent(new CustomEvent("dab:color-change", {
      detail: {
        bodyColor: selectedColorName(bodyInputs),
        accentColor: selectedColorName(accentInputs)
      }
    }));
  };
  const bodyColor = new THREE.Color(selectedBody());
  const accentColor = new THREE.Color(selectedAccent());

  function setAvailableColors(inputs, availableNames, defaultName) {
    const restricted = Array.isArray(availableNames) && availableNames.length > 0;
    const allowed = new Set(availableNames || []);
    let selection = null;

    inputs.forEach((input) => {
      const label = input.closest("label");
      const isAvailable = !restricted || allowed.has(label?.title);
      if (label) label.hidden = !isAvailable;
      input.disabled = !isAvailable;
      if (isAvailable && label?.title === defaultName) selection = input;
      if (isAvailable && !selection) selection = input;
    });

    if (selection) {
      selection.checked = true;
      selection.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.68,
    metalness: 0.02
  });

  let model = null;
  let accentMask = null;
  let triangleCount = 0;
  let loadSequence = 0;
  let accentMode = null;

  function createCenterBackingMask(geometry) {
    const positions = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const centerX = (box.min.x + box.max.x) / 2;
    const centerY = (box.min.y + box.max.y) / 2;
    const halfWidth = (box.max.x - box.min.x) * 0.37;
    const halfHeight = (box.max.y - box.min.y) * 0.32;
    const mask = new Uint8Array(positions.count / 3);

    for (let triangle = 0; triangle < mask.length; triangle += 1) {
      let matches = true;
      for (let vertex = 0; vertex < 3; vertex += 1) {
        const index = (triangle * 3) + vertex;
        if (
          Math.abs(positions.getX(index) - centerX) > halfWidth ||
          Math.abs(positions.getY(index) - centerY) > halfHeight
        ) {
          matches = false;
          break;
        }
      }
      if (matches) mask[triangle] = 1;
    }

    return mask;
  }

  function readAccentMask(buffer) {
    const files = unzipSync(new Uint8Array(buffer));
    for (const [name, contents] of Object.entries(files)) {
      if (!name.toLowerCase().endsWith(".model")) continue;
      const document = new DOMParser().parseFromString(strFromU8(contents), "application/xml");
      const triangles = document.getElementsByTagName("triangle");
      if (!triangles.length) continue;

      const mask = new Uint8Array(triangles.length);
      for (let index = 0; index < triangles.length; index += 1) {
        if (triangles[index].hasAttribute("paint_color")) mask[index] = 1;
      }
      return mask;
    }

    return null;
  }

  function readPlanarAccentRegion(buffer) {
    const files = unzipSync(new Uint8Array(buffer));
    for (const [name, contents] of Object.entries(files)) {
      if (!name.toLowerCase().endsWith(".model")) continue;
      const document = new DOMParser().parseFromString(strFromU8(contents), "application/xml");
      const vertices = Array.from(document.getElementsByTagName("vertex"));
      const painted = Array.from(document.getElementsByTagName("triangle"))
        .filter((triangle) => triangle.hasAttribute("paint_color"));
      if (!vertices.length || !painted.length) continue;

      const region = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity
      };

      painted.forEach((triangle) => {
        ["v1", "v2", "v3"].forEach((attribute) => {
          const vertex = vertices[Number.parseInt(triangle.getAttribute(attribute), 10)];
          if (!vertex) return;
          const x = Number.parseFloat(vertex.getAttribute("x"));
          const y = Number.parseFloat(vertex.getAttribute("y"));
          const z = Number.parseFloat(vertex.getAttribute("z"));
          region.minX = Math.min(region.minX, x);
          region.maxX = Math.max(region.maxX, x);
          region.minY = Math.min(region.minY, y);
          region.maxY = Math.max(region.maxY, y);
          region.minZ = Math.min(region.minZ, z);
          region.maxZ = Math.max(region.maxZ, z);
        });
      });

      if ((region.maxZ - region.minZ) < 0.01) return region;
    }

    return null;
  }

  function createPlanarAccentMask(geometry, region) {
    const positions = geometry.getAttribute("position");
    const mask = new Uint8Array(positions.count / 3);
    const tolerance = 0.02;

    for (let triangle = 0; triangle < mask.length; triangle += 1) {
      let matches = true;
      for (let vertex = 0; vertex < 3; vertex += 1) {
        const index = (triangle * 3) + vertex;
        const x = positions.getX(index);
        const y = positions.getY(index);
        const z = positions.getZ(index);
        if (
          x < region.minX - tolerance || x > region.maxX + tolerance ||
          y < region.minY - tolerance || y > region.maxY + tolerance ||
          Math.abs(z - region.minZ) > tolerance
        ) {
          matches = false;
          break;
        }
      }
      if (matches) mask[triangle] = 1;
    }

    return mask;
  }

  function readPackagedMesh(buffer) {
    const files = unzipSync(new Uint8Array(buffer));

    for (const [name, contents] of Object.entries(files)) {
      if (!name.toLowerCase().endsWith(".model")) continue;
      const document = new DOMParser().parseFromString(strFromU8(contents), "application/xml");
      const mesh = document.querySelector("mesh");
      if (!mesh) continue;

      const vertexNodes = mesh.querySelectorAll("vertices vertex");
      const triangleNodes = mesh.querySelectorAll("triangles triangle");
      if (!vertexNodes.length || !triangleNodes.length) continue;

      const positions = new Float32Array(vertexNodes.length * 3);
      vertexNodes.forEach((vertex, index) => {
        positions[(index * 3)] = Number.parseFloat(vertex.getAttribute("x"));
        positions[(index * 3) + 1] = Number.parseFloat(vertex.getAttribute("y"));
        positions[(index * 3) + 2] = Number.parseFloat(vertex.getAttribute("z"));
      });

      const indices = new Uint32Array(triangleNodes.length * 3);
      triangleNodes.forEach((triangle, index) => {
        indices[(index * 3)] = Number.parseInt(triangle.getAttribute("v1"), 10);
        indices[(index * 3) + 1] = Number.parseInt(triangle.getAttribute("v2"), 10);
        indices[(index * 3) + 2] = Number.parseInt(triangle.getAttribute("v3"), 10);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      return geometry;
    }

    return null;
  }

  function updateVertexColors() {
    if (!model || !accentMask) return;
    const colors = model.geometry.getAttribute("color");

    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const color = accentMask[triangle] ? accentColor : bodyColor;
      for (let vertex = 0; vertex < 3; vertex += 1) {
        colors.setXYZ((triangle * 3) + vertex, color.r, color.g, color.b);
      }
    }

    colors.needsUpdate = true;
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    if (model) positionModel(model);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the mobile block size consistent as the preview canvas gets shorter.
    camera.zoom = window.matchMedia("(max-width: 820px)").matches
      ? THREE.MathUtils.clamp(window.innerHeight * 0.45, 300, 460) / height
      : 1;
    camera.updateProjectionMatrix();
  }

  function positionModel(mesh) {
    mesh.position.y = window.matchMedia("(max-width: 820px)").matches
      ? 0
      : (stage.clientWidth < 620 ? 0.25 : 0.55);
  }

  function fitModel(mesh, url) {
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    mesh.geometry.translate(-center.x, -center.y, -center.z);
    const maxAxis = Math.max(size.x, size.y, size.z);
    const targetSize = stage.clientWidth < 620 ? 1.75 : 2.55;
    const defaultScale = (targetSize / maxAxis) * 0.65;
    const xScale = new URL(url, window.location.href).pathname.endsWith("/dab-block-01.preview.3mf") ? 1 : 0.9;
    mesh.scale.set(defaultScale * xScale, defaultScale, defaultScale);
    mesh.rotation.set(0, 0, 0);
    positionModel(mesh);

    controls.target.set(0, 0, 0);
    controls.update();
  }

  async function loadModel(url) {
    const sequence = ++loadSequence;
    if (status) {
      status.hidden = false;
      status.textContent = "Loading model";
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
      const buffer = await response.arrayBuffer();
      let geometry;
      try {
        const loadedModel = new ThreeMFLoader().parse(buffer);
        loadedModel.updateMatrixWorld(true);
        const sourceMesh = loadedModel.getObjectByProperty("isMesh", true);
        if (!sourceMesh) throw new Error("3MF contains no mesh");
        geometry = sourceMesh.geometry.clone();
        geometry.applyMatrix4(sourceMesh.matrixWorld);
      } catch (loaderError) {
        geometry = readPackagedMesh(buffer);
        if (!geometry) throw loaderError;
      }

      geometry = geometry.toNonIndexed();
      geometry.computeVertexNormals();

      const nextTriangleCount = geometry.getAttribute("position").count / 3;
      const paintedTriangles = readAccentMask(buffer);
      const planarAccentRegion = readPlanarAccentRegion(buffer);
      const nextAccentMask = accentMode === "center-backing"
        ? createCenterBackingMask(geometry)
        : planarAccentRegion
          ? createPlanarAccentMask(geometry, planarAccentRegion)
        : (paintedTriangles?.length === nextTriangleCount
            ? paintedTriangles
            : new Uint8Array(nextTriangleCount));
      geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nextTriangleCount * 9), 3));

      if (sequence !== loadSequence) {
        geometry.dispose();
        return;
      }

      if (model) {
        scene.remove(model);
        model.children.forEach((child) => {
          child.geometry?.dispose();
          child.material?.dispose();
        });
        model.geometry.dispose();
      }

      model = new THREE.Mesh(geometry, material);
      triangleCount = nextTriangleCount;
      accentMask = nextAccentMask;
      fitModel(model, url);
      scene.add(model);
      updateVertexColors();
      if (status) status.hidden = true;
    } catch (error) {
      if (sequence !== loadSequence) return;
      if (status) status.textContent = "Model unavailable";
      console.error(error);
    }
  }

  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance
    );
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
  }

  bodyInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      bodyColor.set(input.value);
      bodyCurrent?.style.setProperty("--swatch-color", input.value);
      if (bodyName) bodyName.textContent = input.closest("label")?.title || "Selected color";
      updateVertexColors();
      dispatchColorSelection();
      if (bodyPalette) bodyPalette.hidden = true;
      bodyToggle?.setAttribute("aria-expanded", "false");
    });
  });

  accentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      accentColor.set(input.value);
      accentCurrent?.style.setProperty("--swatch-color", input.value);
      if (accentName) accentName.textContent = input.closest("label")?.title || "Selected color";
      updateVertexColors();
      dispatchColorSelection();
      if (accentPalette) accentPalette.hidden = true;
      accentToggle?.setAttribute("aria-expanded", "false");
    });
  });

  accentToggle?.addEventListener("click", () => {
    if (!accentPalette) return;
    accentPalette.hidden = !accentPalette.hidden;
    accentToggle.setAttribute("aria-expanded", String(!accentPalette.hidden));
  });

  bodyToggle?.addEventListener("click", () => {
    if (!bodyPalette) return;
    bodyPalette.hidden = !bodyPalette.hidden;
    bodyToggle.setAttribute("aria-expanded", String(!bodyPalette.hidden));
  });

  [bodyToggle, accentToggle].forEach((toggle) => {
    const row = toggle?.closest(".finish-color");
    row?.addEventListener("click", (event) => {
      if (!window.matchMedia("(max-width: 820px)").matches) return;
      if (event.target.closest("button, .filament-palette")) return;
      toggle.click();
    });
  });

  zoomOut?.addEventListener("click", () => zoom(1.18));
  zoomIn?.addEventListener("click", () => zoom(0.84));

  window.addEventListener("dab:model-change", (event) => {
    const detail = event.detail || {};
    accentMode = detail.accentMode || null;
    setAvailableColors(bodyInputs, detail.bodyColors, detail.defaultBodyColor);
    setAvailableColors(accentInputs, detail.accentColors, detail.defaultAccentColor);
    if (detail.modelUrl) loadModel(detail.modelUrl);
  });

  window.addEventListener("dab:checkout-color-change", (event) => {
    const detail = event.detail || {};
    const setColor = (inputs, colorName) => {
      if (!colorName) return;
      const input = inputs.find((candidate) => candidate.closest("label")?.title === colorName);
      if (input && !input.disabled) {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    setColor(bodyInputs, detail.bodyColor);
    setColor(accentInputs, detail.accentColor);
  });

  const selectedVariantId = document.querySelector('input[name="hold-type"]:checked')?.value;
  const selectedVariant = window.DAB_STORE?.product?.variants
    ?.find((variant) => variant.id === selectedVariantId);
  if (selectedVariant) {
    accentMode = selectedVariant.accentMode || null;
    setAvailableColors(bodyInputs, selectedVariant.bodyColors, selectedVariant.defaultBodyColor);
    setAvailableColors(accentInputs, selectedVariant.accentColors, selectedVariant.defaultAccentColor);
  }

  const initialWebsiteColors = [
    [bodyInputs, document.querySelector("#primary-color-select")?.value],
    [accentInputs, document.querySelector("#accent-color-select")?.value]
  ];
  initialWebsiteColors.forEach(([inputs, colorName]) => {
    const input = inputs.find((candidate) => candidate.closest("label")?.title === colorName);
    if (input && !input.disabled) {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  resize();
  window.addEventListener("resize", resize);
  const selectedModelUrl = document.querySelector('input[name="hold-type"]:checked')?.dataset.modelUrl;
  loadModel(selectedModelUrl || defaultModelUrl);

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
