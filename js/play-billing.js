// HOS Load Calculator PRO PLUS
// Google Play Billing Bridge
// Product IDs:
//   hos_pro       = $14.99
//   hos_pro_plus  = $29.99

(function () {
  "use strict";

  const PRODUCTS = {
    PRO: "hos_pro",
    PRO_PLUS: "hos_pro_plus"
  };

  let digitalGoodsService = null;

  // ------------------------------------------------------------
  // CHECK WHETHER GOOGLE PLAY BILLING IS AVAILABLE
  // ------------------------------------------------------------

  async function initializePlayBilling() {

    if (!("getDigitalGoodsService" in window)) {
      console.log("SCUBER/HOS Billing: Digital Goods API not available.");
      return false;
    }

    try {

      digitalGoodsService =
        await window.getDigitalGoodsService("https://play.google.com/billing");

      if (!digitalGoodsService) {
        console.log("HOS Billing: Digital Goods service unavailable.");
        return false;
      }

      console.log("HOS Billing: Digital Goods service connected.");

      await refreshUserEntitlement();

      return true;

    } catch (error) {

      console.error(
        "HOS Billing: Unable to initialize Google Play Billing.",
        error
      );

      return false;
    }
  }

  // ------------------------------------------------------------
  // CHECK EXISTING PURCHASES
  // ------------------------------------------------------------

  async function refreshUserEntitlement() {

    if (!digitalGoodsService) {
      return;
    }

    try {

      const purchases =
        await digitalGoodsService.listPurchases();

      console.log("HOS Billing: Purchases found:", purchases);

      let userTier = "BASE";

      for (const purchase of purchases) {

        if (purchase.itemId === PRODUCTS.PRO_PLUS) {
          userTier = "PRO_PLUS";
          break;
        }

        if (
          purchase.itemId === PRODUCTS.PRO &&
          userTier !== "PRO_PLUS"
        ) {
          userTier = "PRO";
        }
      }

      setUserTier(userTier);

      await acknowledgePurchases(purchases);

    } catch (error) {

      console.error(
        "HOS Billing: Could not check purchases.",
        error
      );
    }
  }

  // ------------------------------------------------------------
  // SET USER TIER
  // ------------------------------------------------------------

  function setUserTier(tier) {

    if (!window.USER_TIERS[tier]) {
      console.error("HOS Billing: Invalid tier:", tier);
      return;
    }

    window.CURRENT_USER_TIER = tier;

    console.log("HOS Billing: Current user tier =", tier);

    if (typeof window.applyAllFeatureGates === "function") {
      window.applyAllFeatureGates();
    }

    window.dispatchEvent(
      new CustomEvent("hosTierChanged", {
        detail: {
          tier: tier
        }
      })
    );
  }

  // ------------------------------------------------------------
  // ACKNOWLEDGE PURCHASES
  // ------------------------------------------------------------

  async function acknowledgePurchases(purchases) {

    for (const purchase of purchases) {

      if (
        purchase.purchaseState === "purchased" &&
        !purchase.acknowledged
      ) {

        try {

          await digitalGoodsService.acknowledge(purchase.purchaseToken);

          console.log(
            "HOS Billing: Purchase acknowledged:",
            purchase.itemId
          );

        } catch (error) {

          console.error(
            "HOS Billing: Could not acknowledge purchase:",
            purchase.itemId,
            error
          );
        }
      }
    }
  }

  // ------------------------------------------------------------
  // GET PRODUCT INFORMATION
  // ------------------------------------------------------------

  async function getProductDetails(productId) {

    if (!digitalGoodsService) {
      throw new Error("Google Play Billing is not available.");
    }

    const details =
      await digitalGoodsService.getDetails([productId]);

    if (!details || details.length === 0) {
      throw new Error(
        "Google Play product was not found: " + productId
      );
    }

    return details[0];
  }

  // ------------------------------------------------------------
  // PURCHASE PRODUCT
  // ------------------------------------------------------------

  async function purchaseProduct(productId) {

    if (!digitalGoodsService) {
      alert(
        "Google Play purchases are available inside the Android app."
      );
      return;
    }

    try {

      const product = await getProductDetails(productId);

      console.log(
        "HOS Billing: Starting purchase:",
        product
      );

      const paymentDetails = {
        total: {
          label: product.title,
          amount: {
            currency: product.price.currency,
            value: product.price.value
          }
        }
      };

      const request = new PaymentRequest(
        [{
          supportedMethods: "https://play.google.com/billing",
          data: {
            sku: product.itemId
          }
        }],
        paymentDetails
      );

      const response = await request.show();

      await response.complete("success");

      console.log(
        "HOS Billing: Purchase completed:",
        productId
      );

      await refreshUserEntitlement();

    } catch (error) {

      console.error(
        "HOS Billing: Purchase failed:",
        productId,
        error
      );

      alert(
        "The purchase could not be completed. Please try again."
      );
    }
  }

  // ------------------------------------------------------------
  // PUBLIC BILLING API
  // ------------------------------------------------------------

  window.HOS_PLAY_BILLING = {

    initialize: initializePlayBilling,

    refreshEntitlement: refreshUserEntitlement,

    purchasePro: function () {
      return purchaseProduct(PRODUCTS.PRO);
    },

    purchaseProPlus: function () {
      return purchaseProduct(PRODUCTS.PRO_PLUS);
    },

    getCurrentTier: function () {
      return window.CURRENT_USER_TIER;
    }

  };

})();
