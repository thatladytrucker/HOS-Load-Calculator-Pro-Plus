// HOS Load Calculator - Web Unlock Codes
// Lets web users unlock Pro / Pro Plus with a code bought on Payhip.
// Add AFTER js/features.js and js/play-billing.js in index.html.

(function () {
  "use strict";

  // ---- EDIT THESE TWO LINES: your Payhip product links ----
  var PAYHIP_PRO_URL = "";       // e.g. "https://payhip.com/b/XXXXX"
  var PAYHIP_PRO_PLUS_URL = "";  // e.g. "https://payhip.com/b/YYYYY"
  // ---------------------------------------------------------

  var SALT = "hos-unlock-v1|";
  var STORE_KEY = "hos_unlock_tier";

  // Only fingerprints of valid codes are stored here, never the codes.
  var PRO_HASHES = [
    "52f20ddd4ade565e87daf9ee74e863f5375f6cee032baf05fd38757ff12c737c",
    "9e1a6423a37efb1de112949fba97b3e22b347d5c9dda3063aaceebf50fe12168",
    "03192ef711d980948e4ccea78e4c28b14cee365e2e46700177cf9efaba683f59",
    "dc5801d2bb25e699ea72218ac6c843989bfea934f1bf1492d75c63da30f032f4",
    "d31d605f93d05e825e6f22670c59016b13254948f0f832c15c76e22763d5009f",
    "bf3a42e5cebbbe78523402ed6669426e73c321090a2a1b0bb700b4b833622f80",
    "436eef262512632aa131162dddf968b040312df07e4295174d07bd534712f5bb",
    "3f00b7777f3638ba3c35564b291e7cd88aad3ab02cd710ad4e118fe45107686d",
    "33c0fc550d412ffaed68f54ee8909dc11d61a06f0943dbc428a268b577acc94e",
    "8cd7a3355ebaeb7d8bda1fe3b538e098ca45500fd450c74d3628fb9c51193882",
    "33b289e8c471646710f381509302fb47bcecedf5aa80dd16c7b542d574a9175c",
    "13847b9bc7ff49ac9e2a3673507acd901f92e2d0fb5ee9acc60ef3431fa19458",
    "939d86b694dbf0f097118689c80a284af977a3dc4ce5010e0e5575eeb7d2f7ff",
    "41b50e6d27fa1c7e6e50748a5b758b07d076e27651604c1e22498912fd7d048c",
    "925b91df0c41103777b4206068fc967ebd7dc77e27c85455b716ce1f8e8e3a31",
    "f1ec2c45de71073f35f3b1c6075f30b302eb4aeaf44d0968cc52a892ffba17db",
    "ec35787167f6a32c2047cf93f412e6ab07167cfe5ab228b2c5c3e5ea47974fce",
    "0b4c84831ada74e54dcf17e86bcc0e94f55ae892bbd1912bffa472b332ea8112",
    "5855de8413a0b117e0fddc1f77ccb93827d4a21699ad91649ba4268c58834453",
    "73c3902e96e0132515da29a880ecbeb8c53a60d91913c48cbdacbc1e5e46602f",
    "93b071915fb264420aae75f6ccabab0f12717271121a7d72f38467009c808b7d",
    "82dc5e608ad3c19c79d9899c28bc46ec86a0cee5ed4882291b3505b0703215af",
    "cf3ef1131e198b971b01de5ba3d89a3351664d45f1be65c7e766d6799667bd81",
    "26d86bd0f26bc4152b97c7418dfa1a2c1c2b55127012da8d685978a19b08309b",
    "c8dc3ffc89dcf26095cdc74e025441e1928ad3b2717ba151cbdaf0584ee82444",
    "f835a81128d0e767a9d5137d4f2f6332bc23ae62ca7c59ba502ce383e66a140a",
    "a1f55c59fe88c4ea43f84421263c27854be40c6ca5b79ecdfb4980a3a22a9f91",
    "101f7e7b1dade7297f5da8ea1a4dbd5053ab0677da3921f093e95dc54ee53246",
    "6df3d593e3cdd6340b16e210294c73f08651506d8678c63426f4ed1ec4ea1010",
    "c4111f8b2e82a830b8fe5cdeb337629aa9eb4ffc1344afb8466eee51fcd4f049",
    "df7d873c78423a1b9abdd7892529740735c5c239f983fbf2c42ba374a3d181fe",
    "a5f2fbedd70de205a7f50facb7c755a54dee8055c582a274ced706a2496dab23",
    "6b8b295fefc156634ca5bee93eb29e8ec59bb1288c41db03f6aa588e83f3b902",
    "6781656ae4ad30b45c65beffb1c117387a85cc15874eaadf2c40cf6db010824d",
    "f13f6a6669515f0e4b0936ba412685545711fa84bdaba319b263278f6a781d96",
    "8b9ff393fe35a1923fadadfba5ab75081ff4b02dc79ac49ab3631a11208406ed",
    "33397ce7bd13a7c17f5774a880847d36e5dc653e744c59e1b0f5cc0fc000fb2f",
    "aff9a63ea147f7659848d4926ae2392358638962811fd7a8e7fbe7b77b5926e2",
    "f1e05d447e64ac7758ca1685943110977e6283c11a8297e2011494762b88fdd6",
    "56f8f8db118d2f12ecbfb6a287fc58eafe9f8229bf169e727167f1098ea2da2b",
    "f018b30bbc98b77bd9ae03061019d1ce15f11ebac8bcca22753ed0fa2295afd2",
    "1f24273e9843f5ba194d69e0b1f1f356abd26a2925c9fb2db7a8c090cd106994",
    "c7075bc44c9d05ba45c96582242d31ceda2c27d6a1a710c69dd8a443ec0d2db7",
    "51ce4a40de1d6815a60f922aaa8a3e8d4629d0699514fd063aed82ad4a7fc0e0",
    "64d1a95d5a684779178bc22fe3c4c1aaacc6d44fd69e0a5a3cdb6fe172c09889",
    "eee11097a5d7d9c76c05b37fc746f1b1444aad4919a9dfd866cc97973db6b9cc",
    "f0c8f2a005e4f3d1e658f8089be77abf5f1d18936fc20fdc7a577e1978eb7296",
    "729011f0dd2caa8329070e10116af00dda22d698d35174b3e94d1f53efbb3845",
    "1115d1af9fab194835cfb3513f39da69243d6f6702c9cfb6b4cf9f1972b9cfbe",
    "cbb70220ca0ce6cbd806d58ee472b8cfac9c224bf8e3a23a200cc963ec70b095"
  ];
  var PLUS_HASHES = [
    "6da0f59922b92b38bdd1477027a989fa64ac3f9cc32e4e2ece7ef45c81a2e45d",
    "5d5a7384dc385b97e22d4a07e167708e3df5c7945ac66f5dfd005241174a3b84",
    "6c45c367b1f35e24bf271837976b58c2382a454be9e617b94da025003603e990",
    "898cb48e0f4668014d4df96a6b2d3c297193cc77e89e9bae0d9d789bb261919e",
    "34382c0ccb0e64a7858bf136787a4f9e7d06f56c738eba53148e7c5dcd1672ab",
    "84fe4316ac03f1b9c8404474a2aeef4c282423fa4495fbd81e830b80092a035c",
    "60287bc425ff20ec6d893c4c1d5d1b65b48668993baf554f3bcdb36596c85a41",
    "dfbe543873387f7da45dc2b387e5cf48b5e4e85b632c344a599fbf9c6d1b9860",
    "d1e06cf9785ca12afe713c69dd1c881d63b50bf83ab32f15512677820325562b",
    "2a280f63c0875f1bac23c627d04d028d996f242e7f0ad05d20fa83da39cd58ca",
    "9b43525dd750482cabc86558a530d7275d337752a6a6d86fe5c93143a968fae2",
    "00fc557a6b25b3b07c00c85cc481ca8fdbc146c9fca481fb68e54c900e3e126c",
    "40db12942c08b51e88c7826cc39f7e5fc611cb8da216c3714d4c61fb69f412a5",
    "cd90993a610245e4d196a05d016565fa28c2928a8dee5525d06da3ebedbea249",
    "0ed6f7b665e2e57d57b182099f863239eef13dc05213d1f79366fa34cf9f8aaf",
    "f870bc1632c80816d725445c145e811c9e5a584e2c85a5e6169fac8e5dfa7708",
    "14cf0c695a93aa6b49343666f064d2bd79359c6669aa26b28697e926a7f9952c",
    "bf31d56d1a1bd5023ce405afd6aeb05ea8753f895604dc77dfe84f432f5b72fa",
    "00f6ac7a822b68b3c4410580f95b2b0443a12b5b2e751f1c736cddc1f3f31502",
    "414c5711e2beb1e94806a7bac50089115b61e6fcb0bc1483443ccd88eb95bc0d",
    "0d2bac6c006f5c7b0adbd5cc27535009d98f6413acb637304b63389d3570e41b",
    "354f653e7cd51f7a8c16d29b38acfa254211a8046b90a3cec13ec0dad40ffeb9",
    "57b496fe917627d9cabbb9625d520b3ee9498021a6d40208b7b09b14a3023f39",
    "fa2460ef71ce5d8db0ac35fd4ec1618931bf4c57c8d076119fb60e3c84d1442d",
    "e0357060d64a90121da7418b0707a673a8138c7fb91fa11067e3853ae5d66074",
    "f55602b33bd5fa3e5e6df704f4a5804d4524359fa91b227a9f24308fba46b68b",
    "616aebd4cee4bbc4ec1d11196b8aed0813fc2008e551ff57087bf01a3a5e077f",
    "b079fbe83d10f6ecfefc9e318d1f128f09542c6e2d907e98a3659e48d41a979a",
    "01bc2ede7522f6891d6dfc6a995839b0f3f4ff1e7ed4c16fb8ceaa268e333144",
    "256313d34d5251b363ead7824e55bf57b908bdb055c740eafc04997d1cfe7dae",
    "62b8e229910facffba0a183d9f1f23324916187952070081f2e642a8a5adcb3f",
    "e3e6d161e89e68722a19831d6fd130e35fba486928ad7e24c1be56579f768be2",
    "3647985178ac52811bc629857b997e08120f2ca710850694bf1733c9af30c191",
    "e60a5d65cc0f87b78cb1de41b6501743d2a86f3e5d6cd11e232fa654b2d32d73",
    "ebce0a38899221770c7b65cfecbf79b61c07428c2a9f4296881967013ce4b521",
    "ed224dee7f47f304f2e1158425aa578bf9c6b6ce6599cda2163cd1484bc9afec",
    "8a6dd782e2c7b25acef96fcda4109a0ce8c19880067cfbdbbdc8b2097efe1b76",
    "13d84d44be30c7a129175472c3085e7c1927c5c5b146ec33404245e3e86cac29",
    "6bf07b25bf6364741470ee7a0983525085f00644821fbe3cf1452938473aa145",
    "c3be7b895db9f5b159f835afc8c2304ab103e5f7afbaf9871a1dab112a895d94",
    "86b5e798c2a76860be49d3c6597a9312e7cbebe1e3cdaae8ed8ec2ff211f3655",
    "549c5a0d083c1bce146cd60f8dd5262d8e8e5d4be98fb03952be5725a5aea780",
    "920b904b9c5033bdba4703706c4299d69430a406e68062e115fdd0529e316659",
    "9c225c3b00890d528acb4916b24f33a46ea469fd8285fcd9a75cee65d7926f76",
    "6a4011e2acd85a0d837c1318b759786f7b2ae169fd7317b229879cae090bf3e7",
    "61d4f26a9fe9461fb53ac8b226e1e262ab5e7c1467ba56613988e67ae6040baa",
    "9be121d3baf98df5d11a13383c726ed88977cac485224dfc45d89a44538c3524",
    "c82caa070e41a38ffe3b9479ca33a6893df72663432bad9213039010def43a48",
    "925070591ca307182d8b2a4180cb384d339ad73499b523b6cd3de33d7d3b4944",
    "7c19a90949014dd062efc9db40e0f560c1985b97e77e3398839574b9ccf751a0"
  ];

  // Google Play app (Digital Goods API present) keeps using Play Billing.
  var IS_PLAY_APP = "getDigitalGoodsService" in window;
  var RANK = { BASE: 1, PRO: 2, PRO_PLUS: 3 };

  function readStored() {
    try { return localStorage.getItem(STORE_KEY) || "BASE"; }
    catch (e) { return "BASE"; }
  }

  function saveStored(tier) {
    try { localStorage.setItem(STORE_KEY, tier); } catch (e) {}
  }

  function applyTier(tier) {
    if (!window.USER_TIERS || !window.USER_TIERS[tier]) return;
    window.CURRENT_USER_TIER = tier;
    if (typeof window.applyAllFeatureGates === "function") {
      window.applyAllFeatureGates();
    }
    window.dispatchEvent(new CustomEvent("hosTierChanged", { detail: { tier: tier } }));
  }

  async function sha256(text) {
    var bytes = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  async function tierForCode(raw) {
    var clean = String(raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!clean) return null;
    var hash = await sha256(SALT + clean);
    if (PLUS_HASHES.indexOf(hash) !== -1) return "PRO_PLUS";
    if (PRO_HASHES.indexOf(hash) !== -1) return "PRO";
    return null;
  }

  // Never let a lower tier (e.g. a Play check that finds nothing) undo a code unlock.
  window.addEventListener("hosTierChanged", function (e) {
    var stored = readStored();
    var incoming = e && e.detail ? e.detail.tier : "BASE";
    if (RANK[stored] > RANK[incoming]) applyTier(stored);
  });

  // Restore a saved unlock on page load.
  var saved = readStored();
  if (RANK[saved] > RANK[window.CURRENT_USER_TIER || "BASE"]) applyTier(saved);

  // Web only: buy buttons open Payhip instead of the Play message.
  if (!IS_PLAY_APP && window.HOS_PLAY_BILLING) {
    window.HOS_PLAY_BILLING.purchasePro = function () {
      if (PAYHIP_PRO_URL) window.open(PAYHIP_PRO_URL, "_blank", "noopener");
    };
    window.HOS_PLAY_BILLING.purchaseProPlus = function () {
      if (PAYHIP_PRO_PLUS_URL) window.open(PAYHIP_PRO_PLUS_URL, "_blank", "noopener");
    };
  }

  // Web only: add the "enter code" box to the Unlock section.
  function addCodeBox() {
    if (IS_PLAY_APP) return;
    var section = document.getElementById("upgrade-options");
    if (!section || document.getElementById("unlock-code-box")) return;

    var box = document.createElement("div");
    box.id = "unlock-code-box";
    box.className = "upgrade-card";
    box.innerHTML =
      "<h3>Already bought? Enter your code</h3>" +
      "<p>Paste the unlock code from your Payhip receipt.</p>" +
      '<input id="unlock-code-input" type="text" autocomplete="off" ' +
      'autocapitalize="characters" placeholder="PRO-XXXX-XXXX-XXXX" ' +
      'style="width:100%;box-sizing:border-box;padding:10px;margin:6px 0;font-size:16px;">' +
      '<button id="unlock-code-btn" class="btn">Unlock</button>' +
      '<p id="unlock-code-msg" role="status" style="margin-top:8px;"></p>';
    section.appendChild(box);

    var input = document.getElementById("unlock-code-input");
    var msg = document.getElementById("unlock-code-msg");

    document.getElementById("unlock-code-btn").addEventListener("click", async function () {
      try {
        var tier = await tierForCode(input.value);
        if (!tier) {
          msg.textContent = "That code was not recognized. Check it and try again.";
          return;
        }
        if (RANK[tier] <= RANK[readStored()]) {
          msg.textContent = "You already have this level or higher unlocked.";
          return;
        }
        saveStored(tier);
        applyTier(tier);
        input.value = "";
        msg.textContent = (tier === "PRO_PLUS" ? "Pro Plus" : "Pro") + " unlocked. Thank you!";
      } catch (err) {
        msg.textContent = "Could not check the code on this device. Try again in a modern browser.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addCodeBox);
  } else {
    addCodeBox();
  }
})();
