const store = window.DAB_STORE;
const productPage = document.querySelector("#product-page");
const isLocalCheckoutTest =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).has("checkout");

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
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
  const position = document.querySelector("#gallery-position");
  const previous = document.querySelector("#gallery-previous");
  const next = document.querySelector("#gallery-next");
  const viewModel = document.querySelector("#view-model");
  const viewPhotos = document.querySelector("#view-photos");
  const modelStage = document.querySelector("#model-stage");
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariantId = document.querySelector('input[name="hold-type"]:checked')?.value;
  let photos = variants.find((variant) => variant.id === selectedVariantId)?.photos || [];
  let activePhoto = 0;
  let modelLoaded = false;

  function showPhoto(index) {
    if (!photos.length) return;
    activePhoto = (index + photos.length) % photos.length;
    if (image) {
      image.src = photos[activePhoto].src;
      image.alt = photos[activePhoto].alt;
      image.style.objectPosition = photos[activePhoto].objectPosition || "center";
    }
    if (position) position.textContent = `${activePhoto + 1} / ${photos.length}`;
  }

  function showModel() {
    if (!gallery || !modelStage) return;
    gallery.hidden = true;
    modelStage.hidden = false;
    if (!modelLoaded) {
      modelLoaded = true;
      import("/assets/js/model-viewer.js?v=20260818-8");
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
  viewPhotos?.addEventListener("click", showPhotos);
  gallery?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activePhoto - 1);
    if (event.key === "ArrowRight") showPhoto(activePhoto + 1);
  });
  window.addEventListener("dab:variant-change", (event) => {
    photos = Array.isArray(event.detail?.variant?.photos) ? event.detail.variant.photos : [];
    showPhoto(0);
  });
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
  const checkoutLabel = checkoutButton.querySelector("span");
  let activeVariant = null;
  let checkoutPending = false;

  productPage?.classList.toggle("sales-disabled", !salesEnabled);

  function updateCheckout() {
    const checkoutUrl = salesEnabled && activeVariant
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
      const defaultDepth = variant.defaultEdgeDepths?.[index] ?? edgeDepths[index] ?? edgeDepths[0];
      select.replaceChildren(...edgeDepths.map((depth) => {
        const option = document.createElement("option");
        option.value = String(depth);
        option.textContent = `${depth} mm`;
        option.selected = depth === defaultDepth;
        return option;
      }));
      select.disabled = !isActive;
    });
    updateCheckout();
    if (checkoutLabel) {
      checkoutLabel.textContent = salesEnabled
        ? (variant.requiresApproval ? "Approval required" : "Order")
        : "Coming soon";
    }
    window.dispatchEvent(new CustomEvent("dab:variant-change", { detail: { variant } }));
  }

  edgeDepthSelects.forEach((select) => {
    select?.addEventListener("change", updateCheckout);
  });

  checkoutButton.addEventListener("click", async (event) => {
    if (!salesEnabled || !activeVariant || checkoutPending) return;

    event.preventDefault();
    checkoutPending = true;
    checkoutButton.setAttribute("aria-disabled", "true");
    const originalLabel = checkoutLabel?.textContent || "Order";
    if (checkoutLabel) checkoutLabel.textContent = "Opening checkout…";

    try {
      const edgeDepths = edgeDepthSelects
        .filter((select) => select && !select.disabled && select.value)
        .map((select) => Number(select.value));
      const checkoutResponse = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: activeVariant.id, edgeDepths })
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

  const initialVariant = variants[0];
  setVariantState(initialVariant);
  picker.hidden = false;
}

if (store && productPage) {
  const product = store.product || {};

  setText("#product-name", product.name);
  setText("#product-eyebrow", product.eyebrow);
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
}
