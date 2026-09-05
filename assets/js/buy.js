const store = window.DAB_STORE;
const productPage = document.querySelector("#product-page");
document.querySelector(".block-guide-link")?.addEventListener("click", () => {
  const guide = document.querySelector("#product-guide");
  if (!guide) return;
  guide.open = true;
  guide.querySelector("summary")?.focus({ preventScroll: true });
});
const isLocalCheckoutTest =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).has("checkout");
const productColorValues = Object.freeze({
  "Clay Pink": "#AD7889",
  Lavender: "#C9C9E7",
  "Soft Lemon": "#FFE09A",
  Charcoal: "#292929"
});

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function renderProductDescription(variant) {
  const storyImage = document.querySelector("#product-story-image");
  const storyPhoto = variant?.storyPhoto || variant?.photos?.[1] || variant?.photos?.[0];
  if (storyImage) {
    storyImage.closest("figure").hidden = !storyPhoto;
    if (storyPhoto) {
      storyImage.src = storyPhoto.src;
      storyImage.alt = storyPhoto.alt;
    }
  }
  const container = document.querySelector("#product-description");
  if (!container) return;

  const content = [];
  const details = Array.isArray(variant?.details) ? variant.details : [];
  details.forEach((copy) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = copy;
    content.push(paragraph);
  });

  container.replaceChildren(...content);
  container.closest(".product-description")?.toggleAttribute("hidden", content.length === 0);

  const guide = document.querySelector("#product-guide-content");
  const comparison = variant?.comparison;
  if (!guide) return;
  const guideCopy = Array.isArray(comparison?.paragraphs) ? comparison.paragraphs : [];
  guide.replaceChildren(...guideCopy.map((copy) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = copy;
    return paragraph;
  }));
  guide.closest(".product-description")?.toggleAttribute("hidden", guideCopy.length === 0);
}

function setCheckout(checkoutButton, checkoutUrl) {
  checkoutButton.removeAttribute("href");
  checkoutButton.setAttribute("aria-disabled", "true");

  if (!checkoutUrl?.trim()) return;

  try {
    const url = new URL(checkoutUrl);
    if (url.protocol === "https:") {
      checkoutButton.href = url.href;
      checkoutButton.removeAttribute("aria-disabled");
    }
  } catch (error) {
    // Keep checkout disabled until a valid HTTPS link is configured.
  }
}

function buildCheckoutUrl(checkoutUrl, variantId, edgeDepthSelects) {
  if (!checkoutUrl?.trim()) return "";

  try {
    const url = new URL(checkoutUrl);
    const selectedDepths = edgeDepthSelects
      .filter((select) => select && !select.disabled && select.value)
      .map((select) => `${select.value}mm`);
    const referenceParts = [variantId, ...selectedDepths]
      .filter(Boolean)
      .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "-"));

    if (referenceParts.length) {
      url.searchParams.set("client_reference_id", referenceParts.join("-depth-"));
    }

    return url.href;
  } catch (error) {
    return "";
  }
}

function initializeProductMedia(product) {
  const gallery = document.querySelector("#product-gallery");
  const image = document.querySelector("#gallery-image");
  const thumbnails = document.querySelector("#gallery-thumbnails");
  const position = document.querySelector("#gallery-position");
  const previous = document.querySelector("#gallery-previous");
  const next = document.querySelector("#gallery-next");
  const viewModel = document.querySelector("#view-model");
  const viewColorsIn3d = document.querySelector("#view-colors-3d");
  const viewPhotos = document.querySelector("#view-photos");
  const modelStage = document.querySelector("#model-stage");
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariantId = document.querySelector('input[name="hold-type"]:checked')?.value;
  let activeVariant = variants.find((variant) => variant.id === selectedVariantId);
  let photos = [];
  let activePhoto = 0;
  let modelLoaded = false;

  function renderThumbnails() {
    if (!thumbnails) return;
    thumbnails.replaceChildren(...photos.map((photo, index) => {
      const button = document.createElement("button");
      const thumbnail = document.createElement("img");
      button.type = "button";
      button.className = "gallery-thumbnail";
      button.dataset.photoIndex = String(index);
      button.setAttribute("aria-label", `View product photo ${index + 1}`);
      thumbnail.src = photo.src;
      thumbnail.alt = "";
      thumbnail.loading = "lazy";
      button.append(thumbnail);
      button.addEventListener("click", () => showPhoto(index));
      return button;
    }));
  }

  function showPhoto(index) {
    if (!photos.length) return;
    activePhoto = (index + photos.length) % photos.length;
    if (image) {
      image.src = photos[activePhoto].src;
      image.alt = photos[activePhoto].alt;
      image.style.objectPosition = photos[activePhoto].objectPosition || "center";
    }
    if (position) position.textContent = `${activePhoto + 1} / ${photos.length}`;
    thumbnails?.querySelectorAll(".gallery-thumbnail").forEach((thumbnail, thumbnailIndex) => {
      const selected = thumbnailIndex === activePhoto;
      thumbnail.classList.toggle("is-active", selected);
      thumbnail.setAttribute("aria-current", selected ? "true" : "false");
    });
  }

  function showModel() {
    if (!gallery || !modelStage) return;
    gallery.hidden = true;
    modelStage.hidden = false;
    if (!modelLoaded) {
      modelLoaded = true;
      import("/assets/js/model-viewer.js?v=20260905-2");
    } else {
      window.dispatchEvent(new Event("resize"));
    }
    viewPhotos?.focus();
  }

  function showPhotos() {
    if (!gallery || !modelStage) return;
    modelStage.hidden = true;
    gallery.hidden = false;
    viewModel?.focus();
  }

  previous?.addEventListener("click", () => showPhoto(activePhoto - 1));
  next?.addEventListener("click", () => showPhoto(activePhoto + 1));
  viewModel?.addEventListener("click", showModel);
  viewColorsIn3d?.addEventListener("click", showModel);
  viewPhotos?.addEventListener("click", showPhotos);
  gallery?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activePhoto - 1);
    if (event.key === "ArrowRight") showPhoto(activePhoto + 1);
  });
  function selectColorPhoto() {
    if (!activeVariant?.colorPhotos?.length) return;
    const bodyColor = document.querySelector("#primary-color-select")?.value;
    const accentColor = document.querySelector("#accent-color-select")?.value;
    const matchingPhoto = activeVariant?.colorPhotos?.find((photo) =>
      photo.bodyColor === bodyColor && photo.accentColor === accentColor
    );
    const fallbackIndex = photos.findIndex((photo) => photo.colorFallback);
    showPhoto(matchingPhoto ? photos.indexOf(matchingPhoto) : Math.max(0, fallbackIndex));
  }

  function updatePhotos() {
    photos = [...(activeVariant?.photos || [])];
    for (const photo of activeVariant?.colorPhotos || []) {
      if (Number.isInteger(photo.galleryPosition) && photo.galleryPosition > 0) {
        photos.splice(photo.galleryPosition - 1, 0, photo);
      } else {
        photos.push(photo);
      }
    }
    renderThumbnails();
    showPhoto(0);
  }

  window.addEventListener("dab:variant-change", (event) => {
    activeVariant = event.detail?.variant;
    updatePhotos();
  });
  window.addEventListener("dab:checkout-color-change", selectColorPhoto);
  window.addEventListener("dab:color-change", selectColorPhoto);

  updatePhotos();
}

function renderVariants(product, checkoutButton, salesEnabled) {
  const picker = document.querySelector("#variant-picker");
  const options = document.querySelector("#variant-options");
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const configuratorSize = document.querySelector("#configurator-size");
  const pricingNote = document.querySelector("#variant-pricing-note");
  const edgeDepthPicker = document.querySelector("#edge-depth-picker");
  const edgeDepthSelects = [
    document.querySelector("#edge-depth-1"),
    document.querySelector("#edge-depth-2")
  ];
  const colorPicker = document.querySelector("#product-color-picker");
  const primaryColorSelect = document.querySelector("#primary-color-select");
  const accentColorSelect = document.querySelector("#accent-color-select");
  const primaryColorSwatch = document.querySelector("#primary-color-swatch");
  const accentColorSwatch = document.querySelector("#accent-color-swatch");
  const checkoutLabel = checkoutButton.querySelector("span");
  let activeVariant = null;
  let selectedBodyColor = "";
  let selectedAccentColor = "";
  let checkoutPending = false;

  function renderOptionButtons(select, title, colors = false) {
    if (!select) return;
    const originalLabel = select.closest("label");
    originalLabel.style.display = "none";
    let group = document.getElementById(`${select.id}-buttons`);
    if (!group) {
      group = document.createElement("fieldset");
      group.id = `${select.id}-buttons`;
      group.className = colors ? "setup-options setup-options--colors" : "setup-options setup-options--depth";
      originalLabel.after(group);
    }
    group.hidden = select.disabled;
    const options = Array.from(select.options).filter((option) => option.value);
    const signature = JSON.stringify(options.map((option) => option.value));
    if (group.dataset.options !== signature) {
      group.dataset.options = signature;
      const legend = document.createElement("legend");
      legend.textContent = title;
      const choices = document.createElement("div");
      choices.className = "setup-choices";
      options.forEach((option) => {
        const label = document.createElement("label");
        label.className = "setup-choice";
        label.title = option.textContent;
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${select.id}-choice`;
        input.value = option.value;
        input.setAttribute("aria-label", option.textContent);
        const face = document.createElement("span");
        if (colors) face.style.setProperty("--option-color", productColorValues[option.value]);
        else face.textContent = option.textContent;
        input.addEventListener("change", () => {
          select.value = input.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        label.append(input, face);
        choices.append(label);
      });
      group.replaceChildren(legend, choices);
    }
    group.querySelector("legend").textContent = title;
    group.querySelectorAll("input").forEach((input) => {
      input.checked = input.value === select.value;
      input.disabled = select.disabled;
    });
  }

  function updateOrderSummary() {
    if (!activeVariant) return;
    const depths = edgeDepthSelects
      .filter((select) => select && !select.disabled && select.value)
      .map((select) => `${select.value} mm`);
    const depthLabel = depths.length
      ? `${depths.join(" + ")} ${depths.length === 1 ? "edge" : "edges"}`
      : "Choose edge size";
    const colorLabel = `${selectedBodyColor || "Primary color pending"} / ${selectedAccentColor || "Accent color pending"}`;
    const setupLabel = `${colorLabel} / ${depths.length ? depthLabel : "Edge size pending"}`;
    setText("#summary-product", `${activeVariant.name} · ${activeVariant.description}`);
    setText("#summary-options", setupLabel);
    setText("#summary-price", activeVariant.price || product.price);
    setText("#checkout-price", `— ${activeVariant.price || product.price}`);
  }

  productPage?.classList.toggle("sales-disabled", !salesEnabled);

  function updateColorSwatches() {
    primaryColorSwatch?.style.setProperty(
      "--selected-color",
      productColorValues[selectedBodyColor] || "transparent"
    );
    accentColorSwatch?.style.setProperty(
      "--selected-color",
      productColorValues[selectedAccentColor] || "transparent"
    );
  }

  function syncColorControls() {
    const allowedColors = store.allowedAccentColors(selectedBodyColor, activeVariant?.accentColors || []);
    if (!allowedColors.includes(selectedAccentColor)) {
      selectedAccentColor = allowedColors[0] || "";
    }
    accentColorSelect?.replaceChildren(...allowedColors.map((color) => new Option(color, color)));
    if (primaryColorSelect) primaryColorSelect.value = selectedBodyColor;
    if (accentColorSelect) accentColorSelect.value = selectedAccentColor;
    updateColorSwatches();
    renderOptionButtons(primaryColorSelect, "Block color", true);
    renderOptionButtons(accentColorSelect, "Insert color", true);
  }

  function updateCheckout() {
    edgeDepthSelects.forEach((select, index) => renderOptionButtons(
      select, activeVariant?.edgeDepthCount === 1 ? "Edge depth" : `Edge depth ${index + 1}`
    ));
    const activeDepths = edgeDepthSelects.filter((select) => select && !select.disabled);
    const ready = activeDepths.every((select) => select.value) &&
      (!colorPicker || colorPicker.hidden || (selectedBodyColor && selectedAccentColor));
    const checkoutUrl = salesEnabled && activeVariant && ready
      ? buildCheckoutUrl(activeVariant.checkoutUrl, activeVariant.id, edgeDepthSelects)
      : "";
    setCheckout(checkoutButton, checkoutUrl);
  }

  function setConfiguratorSize(variant) {
    if (configuratorSize && variant?.name) {
      configuratorSize.value = variant.id;
    }
  }

  function setVariantState(variant) {
    activeVariant = variant;
    setText("#product-name", variant.name);
    setText("#product-subtitle", variant.description);
    setText("#product-price", variant.price || product.price);
    renderProductDescription(variant);
    setText("#product-number", `${String(variants.indexOf(variant) + 1).padStart(2, "0")} / ${String(variants.length).padStart(2, "0")}`);
    document.title = `DAB — ${variant.name}`;
    selectedBodyColor = variant.defaultBodyColor || "";
    selectedAccentColor = variant.defaultAccentColor || "";
    setConfiguratorSize(variant);
    if (pricingNote) pricingNote.hidden = !variant.requiresApproval;
    const edgeDepths = Array.isArray(variant.edgeDepths) ? variant.edgeDepths : [];
    const edgeDepthCount = Math.min(variant.edgeDepthCount || edgeDepthSelects.length, edgeDepthSelects.length);
    if (edgeDepthPicker) {
      edgeDepthPicker.hidden = edgeDepths.length === 0;
      edgeDepthPicker.classList.toggle("edge-depth-picker--single", edgeDepthCount === 1);
    }
    edgeDepthSelects.forEach((select, index) => {
      if (!select) return;
      const isActive = edgeDepths.length > 0 && index < edgeDepthCount;
      const label = select.closest("label");
      if (label) label.hidden = !isActive;
      const placeholder = new Option("Choose edge size", "");
      placeholder.selected = true;
      select.replaceChildren(placeholder, ...edgeDepths.map((depth) => {
        const option = document.createElement("option");
        option.value = String(depth);
        option.textContent = `${depth} mm`;
        return option;
      }));
      select.disabled = !isActive;
    });
    const bodyColors = Array.isArray(variant.bodyColors) ? variant.bodyColors : [];
    const accentColors = Array.isArray(variant.accentColors) ? variant.accentColors : [];
    if (colorPicker) colorPicker.hidden = !bodyColors.length || !accentColors.length;
    if (primaryColorSelect) {
      primaryColorSelect.replaceChildren(...bodyColors.map((color) => new Option(color, color)));
      primaryColorSelect.value = selectedBodyColor;
    }
    if (accentColorSelect) {
      accentColorSelect.replaceChildren(...accentColors.map((color) => new Option(color, color)));
      accentColorSelect.value = selectedAccentColor;
    }
    syncColorControls();
    updateOrderSummary();
    updateCheckout();
    if (checkoutLabel) {
      checkoutLabel.textContent = salesEnabled
        ? (variant.requiresApproval ? "Request approval" : "Add to Cart")
        : "Coming soon";
    }
    window.dispatchEvent(new CustomEvent("dab:variant-change", { detail: { variant } }));
  }

  edgeDepthSelects.forEach((select) => {
    select?.addEventListener("change", () => {
      updateOrderSummary();
      updateCheckout();
    });
  });

  window.addEventListener("dab:color-change", (event) => {
    // Ignore the model viewer's initial palette defaults; colors must be
    // explicitly chosen in the product controls before checkout.
    if (event.detail?.bodyColor && primaryColorSelect?.value) {
      selectedBodyColor = event.detail.bodyColor;
    }
    if (event.detail?.accentColor && accentColorSelect?.value) {
      selectedAccentColor = event.detail.accentColor;
    }
    syncColorControls();
    updateOrderSummary();
    updateCheckout();
  });

  primaryColorSelect?.addEventListener("change", () => {
    selectedBodyColor = primaryColorSelect.value;
    syncColorControls();
    updateOrderSummary();
    updateCheckout();
    window.dispatchEvent(new CustomEvent("dab:checkout-color-change", {
      detail: { bodyColor: selectedBodyColor, accentColor: selectedAccentColor }
    }));
  });

  accentColorSelect?.addEventListener("change", () => {
    selectedAccentColor = accentColorSelect.value;
    syncColorControls();
    updateOrderSummary();
    updateCheckout();
    window.dispatchEvent(new CustomEvent("dab:checkout-color-change", {
      detail: { bodyColor: selectedBodyColor, accentColor: selectedAccentColor }
    }));
  });

  checkoutButton.addEventListener("click", async (event) => {
    if (!salesEnabled || !activeVariant || checkoutPending ||
      checkoutButton.getAttribute("aria-disabled") === "true") return;

    event.preventDefault();
    checkoutPending = true;
    checkoutButton.setAttribute("aria-disabled", "true");
    const originalLabel = checkoutLabel?.textContent || "Add to Cart";
    if (checkoutLabel) checkoutLabel.textContent = "Opening checkout…";

    try {
      const edgeDepths = edgeDepthSelects
        .filter((select) => select && !select.disabled && select.value)
        .map((select) => Number(select.value));
      const checkoutResponse = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: activeVariant.id,
          edgeDepths,
          bodyColor: selectedBodyColor,
          accentColor: selectedAccentColor
        })
      });
      const checkout = await checkoutResponse.json();

      if (!checkoutResponse.ok || !checkout.url) {
        throw new Error(checkout.error || "Checkout is unavailable.");
      }

      window.location.assign(checkout.url);
    } catch (error) {
      checkoutPending = false;
      checkoutButton.removeAttribute("aria-disabled");
      if (checkoutLabel) checkoutLabel.textContent = originalLabel;
      window.alert(error.message || "Checkout is temporarily unavailable. Please try again.");
    }
  });

  if (!picker || !options || !variants.length) {
    setCheckout(checkoutButton, salesEnabled ? product.checkoutUrl : "");
    return;
  }

  if (configuratorSize) {
    const selectorOptions = variants.map((variant) => {
      const option = document.createElement("option");
      option.value = variant.id;
      option.textContent = variant.name;
      return option;
    });

    configuratorSize.replaceChildren(...selectorOptions);
    configuratorSize.disabled = variants.length < 2;
    configuratorSize.addEventListener("change", () => {
      const matchingInput = Array.from(options.querySelectorAll('input[name="hold-type"]'))
        .find((input) => input.value === configuratorSize.value);

      if (matchingInput) {
        matchingInput.checked = true;
        matchingInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  variants.forEach((variant, index) => {
    const label = document.createElement("label");
    label.className = "variant-option";
    if (variant.requiresApproval) label.classList.add("variant-option--custom");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "hold-type";
    input.value = variant.id;
    input.dataset.modelUrl = variant.modelUrl || "";
    input.checked = index === 0;

    const copy = document.createElement("span");
    copy.className = "variant-copy";

    const name = document.createElement("span");
    name.className = "variant-name";
    name.textContent = variant.name;

    const price = document.createElement("span");
    price.className = "variant-price";
    if (variant.requiresApproval) price.classList.add("variant-price--quote");
    price.textContent = variant.price || product.price || "";
    if (!salesEnabled) price.setAttribute("aria-label", "Pricing coming soon");

    const description = document.createElement("span");
    description.className = "variant-description";
    description.textContent = variant.description;

    copy.append(name, price, description);
    label.append(input, copy);
    options.append(label);

    input.addEventListener("change", () => {
      setVariantState(variant);
      window.dispatchEvent(new CustomEvent("dab:model-change", {
        detail: {
          modelUrl: variant.modelUrl,
          bodyColors: variant.bodyColors,
          accentColors: variant.accentColors,
          defaultBodyColor: variant.defaultBodyColor,
          defaultAccentColor: variant.defaultAccentColor,
          accentMode: variant.accentMode
        }
      }));
    });
  });

  const pathVariantId = window.location.pathname.includes("block-01")
    ? "hold-type-02"
    : window.location.pathname.includes("block-02")
      ? "hold-type-01"
      : "";
  const requestedVariantId = new URLSearchParams(window.location.search).get("variant") || pathVariantId;
  const initialVariant = variants.find((variant) => variant.id === requestedVariantId) || variants[0];
  setVariantState(initialVariant);
  const initialInput = options.querySelector(`input[value="${initialVariant.id}"]`);
  if (initialInput) initialInput.checked = true;
  picker.hidden = false;
}

if (store && productPage) {
  const product = store.product || {};

  setText("#product-description", product.description);
  setText("#product-availability", product.availability);
  setText("#product-shipping", product.shipping);
  setText("#product-returns", product.returns);

  const checkoutButton = document.querySelector("#checkout-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", (event) => {
      if (checkoutButton.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
      }
    });
    renderVariants(product, checkoutButton, store.enabled || isLocalCheckoutTest);
  }

  productPage.hidden = false;
  initializeProductMedia(product);

  document.querySelectorAll("[data-product-variant]").forEach((link) => {
    link.addEventListener("click", () => {
      const matchingInput = document.querySelector(
        `input[name="hold-type"][value="${link.dataset.productVariant}"]`
      );
      if (!matchingInput) return;
      matchingInput.checked = true;
      matchingInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}
