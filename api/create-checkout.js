const PRODUCTS = Object.freeze({
  "hold-type-01": Object.freeze({
    name: "Block 02",
    amount: 3000,
    edgeDepthCount: 1,
    edgeDepths: Object.freeze([12, 15, 18, 20, 22, 25])
  }),
  "hold-type-02": Object.freeze({
    name: "Block 01",
    amount: 2500,
    edgeDepthCount: 2,
    edgeDepths: Object.freeze([12, 15, 18, 20, 22, 25])
  })
});

function getSiteOrigin(request) {
  const forwardedHost = request.headers["x-forwarded-host"] || request.headers.host || "";
  const host = forwardedHost.split(",")[0].trim().toLowerCase();

  if (host === "dabclimbing.com" || host === "www.dabclimbing.com") {
    return `https://${host}`;
  }

  if (host.endsWith(".vercel.app")) {
    return `https://${host}`;
  }

  if (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")) {
    return `http://${host}`;
  }

  return "https://www.dabclimbing.com";
}

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return sendJson(response, 500, { error: "Checkout is not configured." });
  }

  const product = PRODUCTS[request.body?.variantId];
  const requestedDepths = Array.isArray(request.body?.edgeDepths)
    ? request.body.edgeDepths.map(Number)
    : [];

  if (!product) {
    return sendJson(response, 400, { error: "Select a valid product." });
  }

  const edgeDepths = requestedDepths.slice(0, product.edgeDepthCount);
  const validDepths = edgeDepths.length === product.edgeDepthCount &&
    edgeDepths.every((depth) => product.edgeDepths.includes(depth));

  if (!validDepths) {
    return sendJson(response, 400, { error: "Select a valid edge depth." });
  }

  const edgeDepthLabel = edgeDepths.map((depth) => `${depth} mm`).join(" / ");
  const referenceId = `${request.body.variantId}-depth-${edgeDepths.join("mm-depth-")}mm`;
  const origin = getSiteOrigin(request);

  try {
    const checkoutData = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/thank-you/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/buy/`,
      client_reference_id: referenceId,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(product.amount),
      "line_items[0][price_data][product_data][name]": `${product.name} — Edge depth: ${edgeDepthLabel}`,
      "line_items[0][quantity]": "1",
      "metadata[variant_id]": request.body.variantId,
      "metadata[product_name]": product.name,
      "metadata[edge_depths]": edgeDepthLabel,
      "payment_intent_data[metadata][variant_id]": request.body.variantId,
      "payment_intent_data[metadata][product_name]": product.name,
      "payment_intent_data[metadata][edge_depths]": edgeDepthLabel,
      "shipping_address_collection[allowed_countries][0]": "US",
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": "595",
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "usd",
      "shipping_options[0][shipping_rate_data][display_name]": "Standard shipping"
    });
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: checkoutData
    });
    const stripeBody = await stripeResponse.json();

    if (!stripeResponse.ok || !stripeBody.url) {
      throw new Error(stripeBody?.error?.message || "Stripe could not start checkout.");
    }

    return sendJson(response, 200, { url: stripeBody.url });
  } catch (error) {
    console.error("Checkout session error:", error.message);
    return sendJson(response, 502, { error: "Checkout is temporarily unavailable. Please try again." });
  }
}
