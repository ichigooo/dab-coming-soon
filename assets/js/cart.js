const cartDialog = document.querySelector("#cart-dialog");
const cartTrigger = document.querySelector("#cart-trigger");
const cartClose = document.querySelector("#cart-close");
const cartShopLink = document.querySelector("#cart-shop-link");

cartTrigger?.addEventListener("click", () => {
  if (typeof cartDialog?.showModal === "function") {
    cartDialog.showModal();
  }
});

cartClose?.addEventListener("click", () => cartDialog?.close());
cartShopLink?.addEventListener("click", () => cartDialog?.close());

cartDialog?.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});
