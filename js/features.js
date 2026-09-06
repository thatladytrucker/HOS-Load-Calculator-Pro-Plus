// HOS Load Calculator PRO Plus
// Feature Tier Control System
// Master-v7.0.0

window.APP_FEATURES = {

  edition: "PRO_PLUS",

  features: {

    // BASE FEATURES
    tripPlanning: true,
    tripId: true,
    mphSelection: true,
    tripStart: true,
    deadheadMiles: true,
    loadedMiles: true,
    appointments: true,
    stopTypes: true,
    etaCalculations: true,
    ptaCalculations: true,
    calculateButton: true,
    resetButton: true,


    // PRO FEATURES
    weekly70Clock: true,
    stop02: true,
    fuelStop: true,


    // PRO PLUS FEATURES
    expandedDutyTracking: true,
    splitSleeper: true,
    recaps: true,
    latestDispatch: true,
    appointmentFeasibility: true,
    loadRunStatus: true,
    decisionCenter: true,
    cargoWeight: true

  }

};
// USER TIER ACCESS
window.USER_TIERS = {
  BASE: 1,
  PRO: 2,
  PRO_PLUS: 3
};

// CURRENT USER TIER
// BASE is the default until Google Play entitlement is confirmed.
window.CURRENT_USER_TIER = "BASE";

// REQUIRED TIER FOR EACH FEATURE
window.FEATURE_REQUIREMENTS = {

  // BASE
  tripPlanning: "BASE",
  tripId: "BASE",
  mphSelection: "BASE",
  tripStart: "BASE",
  deadheadMiles: "BASE",
  loadedMiles: "BASE",
  appointments: "BASE",
  stopTypes: "BASE",
  etaCalculations: "BASE",
  ptaCalculations: "BASE",
  calculateButton: "BASE",
  resetButton: "BASE",

  // PRO
  weekly70Clock: "PRO",
  stop02: "PRO",
  fuelStop: "PRO",

  // PRO PLUS
  cargoWeight: "PRO_PLUS",
  expandedDutyTracking: "PRO_PLUS",
  splitSleeper: "PRO_PLUS",
  recaps: "PRO_PLUS",
  latestDispatch: "PRO_PLUS",
  appointmentFeasibility: "PRO_PLUS",
  loadRunStatus: "PRO_PLUS",
  decisionCenter: "PRO_PLUS"
};
// CHECK IF USER HAS ACCESS TO A FEATURE
window.hasFeatureAccess = function(featureName, userTier) {

  const requiredTier = window.FEATURE_REQUIREMENTS[featureName];

  if (!requiredTier) {
    return false;
  }

  return window.USER_TIERS[userTier] >= window.USER_TIERS[requiredTier];
};

// APPLY FEATURE ACCESS TO A PAGE SECTION
window.applyFeatureGate = function(elementId, featureName) {

  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  const allowed = window.hasFeatureAccess(
    featureName,
    window.CURRENT_USER_TIER
  );

  element.style.display = allowed ? "" : "none";
};
// APPLY ALL FEATURE GATES
window.applyAllFeatureGates = function() {

  applyFeatureGate("pro-stop02", "stop02");
  applyFeatureGate("pro-fuel-stop", "fuelStop");
  applyFeatureGate("pro-hos-clocks", "weekly70Clock");

  applyFeatureGate("proplus-recaps", "recaps");
  applyFeatureGate("proplus-recap-results", "recaps");
  applyFeatureGate("proplus-latest-dispatch", "latestDispatch");
  applyFeatureGate(
    "proplus-appointment-feasibility",
    "appointmentFeasibility"
  );
  applyFeatureGate(
    "proplus-load-run-status",
    "loadRunStatus"
  );
  applyFeatureGate(
    "proplus-split-sleeper",
    "splitSleeper"
  );
};

// APPLY INITIAL FEATURE ACCESS
window.applyAllFeatureGates();
