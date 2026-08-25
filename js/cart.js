/* =========================================================================
   Feane – Product View / Cart / E-Wallet QR Checkout
   -------------------------------------------------------------------------
   Drop-in, dependency-light (vanilla JS) cart system for the static Feane
   template. Include this file (after qrcode.min.js) on every page that
   shows the shared header, since the cart icon + badge live there.

   NOTE ON PAYMENTS: There is no real GCash / Maya / GrabPay account behind
   this. The QR code encodes a plain-text order summary so you can see the
   flow end-to-end. To accept real payments you'd swap `buildPayQrPayload()`
   below for a call to your payment provider's API (e.g. GCash / PayMaya
   "Create QR" or "Create Payment Intent" endpoint) from your backend, and
   render the QR string / image that endpoint returns instead.
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     1. PRODUCT CATALOG
     Matches the images/f1.png … f9.png items used on index.html & menu.html
  --------------------------------------------------------------------- */
  var PRODUCTS = {
    f1: { id: "f1", name: "Delicious Pizza",  price: 20, img: "images/f1.png", category: "Pizza",  desc: "A wood-fired classic loaded with a generous blend of melted cheeses, rich tomato sauce and fresh herbs." },
    f2: { id: "f2", name: "Delicious Burger", price: 15, img: "images/f2.png", category: "Burger", desc: "A juicy grilled patty stacked with crisp veggies and our house sauce, tucked into a toasted bun." },
    f3: { id: "f3", name: "Delicious Pizza",  price: 17, img: "images/f3.png", category: "Pizza",  desc: "Thin, crispy crust topped with a hearty mix of savory toppings and melted cheese." },
    f4: { id: "f4", name: "Delicious Pasta",  price: 18, img: "images/f4.png", category: "Pasta",  desc: "Al dente pasta tossed in a rich, creamy sauce finished with fresh herbs and parmesan." },
    f5: { id: "f5", name: "French Fries",     price: 10, img: "images/f5.png", category: "Fries",  desc: "Golden, crispy fries seasoned to perfection — the perfect side or snack on its own." },
    f6: { id: "f6", name: "Delicious Pizza",  price: 15, img: "images/f6.png", category: "Pizza",  desc: "A lighter take on our classic pizza, still packed with flavor in every slice." },
    f7: { id: "f7", name: "Tasty Burger",     price: 12, img: "images/f7.png", category: "Burger", desc: "A budget-friendly burger that never skimps on taste — a house favorite." },
    f8: { id: "f8", name: "Tasty Burger",     price: 14, img: "images/f8.png", category: "Burger", desc: "Double the toppings, double the flavor — for when a regular burger just won't do." },
    f9: { id: "f9", name: "Delicious Pasta",  price: 10, img: "images/f9.png", category: "Pasta",  desc: "A comforting, generous bowl of pasta at a great price." }
  };

  /* E-wallet choices for checkout. Add/remove entries as needed. */
  var EWALLETS = [
    { id: "gcash",     name: "GCash",           swatch: "#0072CE" },
    { id: "paymaya",   name: "Maya (PayMaya)",  swatch: "#00C56B" },
    { id: "grabpay",   name: "GrabPay",         swatch: "#00B14F" },
    { id: "shopeepay", name: "ShopeePay",       swatch: "#EE4D2D" }
  ];

  var CART_KEY = "feane_cart_v1";
  var CURRENCY = "₱"; // change to "₱" if you'd rather quote pesos directly

  /* ---------------------------------------------------------------------
     2. CART STORAGE
  --------------------------------------------------------------------- */
  var Cart = {
    get: function () {
      try {
        var raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    save: function (items) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      renderBadge();
    },
    add: function (id, qty) {
      qty = qty || 1;
      var items = Cart.get();
      var existing = items.find(function (i) { return i.id === id; });
      if (existing) {
        existing.qty += qty;
      } else {
        items.push({ id: id, qty: qty });
      }
      Cart.save(items);
    },
    setQty: function (id, qty) {
      var items = Cart.get();
      if (qty <= 0) {
        items = items.filter(function (i) { return i.id !== id; });
      } else {
        items.forEach(function (i) { if (i.id === id) i.qty = qty; });
      }
      Cart.save(items);
    },
    remove: function (id) {
      var items = Cart.get().filter(function (i) { return i.id !== id; });
      Cart.save(items);
    },
    clear: function () {
      Cart.save([]);
    },
    count: function () {
      return Cart.get().reduce(function (sum, i) { return sum + i.qty; }, 0);
    },
    total: function () {
      return Cart.get().reduce(function (sum, i) {
        var p = PRODUCTS[i.id];
        return p ? sum + p.price * i.qty : sum;
      }, 0);
    }
  };

  function money(n) {
    return CURRENCY + n.toFixed(2);
  }

  function orderRef() {
    return "FEANE-" + Date.now().toString(36).toUpperCase();
  }

  /* ---------------------------------------------------------------------
     3. STYLES
  --------------------------------------------------------------------- */
  var css = [
    ":root{--fc-accent:#eb545a;--fc-dark:#1e1e1e;}",
    ".cart_count_badge{position:absolute;top:-8px;right:-10px;background:var(--fc-accent);color:#fff;border-radius:50%;font-size:11px;line-height:1;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:2px;font-weight:700;}",
    "a.cart_link{position:relative;}",
    ".fc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:9999;padding:20px;}",
    ".fc-overlay.fc-open{display:flex;}",
    ".fc-modal{background:#fff;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;max-height:90vh;}",
    ".fc-modal-sm{max-width:420px;}",
    ".fc-modal-md{max-width:560px;}",
    ".fc-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee;}",
    ".fc-modal-head h3{margin:0;font-size:18px;font-weight:700;color:var(--fc-dark);}",
    ".fc-close{background:none;border:none;font-size:22px;line-height:1;cursor:pointer;color:#888;padding:4px 8px;}",
    ".fc-close:hover{color:#111;}",
    ".fc-modal-body{padding:20px;overflow-y:auto;}",
    ".fc-modal-foot{padding:16px 20px;border-top:1px solid #eee;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}",
    ".fc-btn{border:none;border-radius:6px;padding:10px 18px;font-weight:600;cursor:pointer;font-size:14px;transition:opacity .15s;}",
    ".fc-btn:hover{opacity:.88;}",
    ".fc-btn:disabled{opacity:.5;cursor:not-allowed;}",
    ".fc-btn-primary{background:var(--fc-accent);color:#fff;}",
    ".fc-btn-ghost{background:#f1f1f1;color:#333;}",
    ".fc-btn-block{width:100%;text-align:center;}",
    ".fc-pv-img{width:100%;max-height:260px;object-fit:contain;background:#faf7f5;border-radius:8px;}",
    ".fc-pv-name{font-size:20px;font-weight:700;margin:14px 0 4px;color:var(--fc-dark);}",
    ".fc-pv-cat{display:inline-block;background:#f4e9e2;color:var(--fc-accent);font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:10px;text-transform:uppercase;letter-spacing:.03em;}",
    ".fc-pv-desc{color:#666;font-size:14px;line-height:1.6;margin-bottom:16px;}",
    ".fc-pv-price{font-size:22px;font-weight:800;color:var(--fc-accent);}",
    ".fc-qty{display:flex;align-items:center;gap:0;border:1px solid #ddd;border-radius:6px;overflow:hidden;width:fit-content;}",
    ".fc-qty button{background:#f7f7f7;border:none;width:34px;height:34px;font-size:16px;cursor:pointer;}",
    ".fc-qty input{width:44px;height:34px;text-align:center;border:none;border-left:1px solid #ddd;border-right:1px solid #ddd;font-size:14px;}",
    ".fc-row-between{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:16px 0;}",
    ".fc-cart-item{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;}",
    ".fc-cart-item img{width:56px;height:56px;object-fit:contain;background:#faf7f5;border-radius:6px;flex-shrink:0;}",
    ".fc-cart-item .fc-ci-info{flex:1;min-width:0;}",
    ".fc-cart-item .fc-ci-name{font-weight:600;color:var(--fc-dark);font-size:14px;}",
    ".fc-cart-item .fc-ci-unit{color:#999;font-size:12px;}",
    ".fc-cart-item .fc-ci-remove{background:none;border:none;color:#c33;cursor:pointer;font-size:12px;margin-left:8px;}",
    ".fc-empty{text-align:center;color:#999;padding:30px 10px;}",
    ".fc-summary-line{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#555;}",
    ".fc-summary-total{display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:1px solid #eee;font-size:17px;font-weight:800;color:var(--fc-dark);}",
    ".fc-field{margin-bottom:12px;}",
    ".fc-field label{display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:5px;}",
    ".fc-field input{width:100%;padding:9px 11px;border:1px solid #ddd;border-radius:6px;font-size:14px;}",
    ".fc-wallets{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 4px;}",
    ".fc-wallet{border:2px solid #eee;border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;font-weight:600;font-size:13px;color:#333;}",
    ".fc-wallet.fc-wallet-selected{border-color:var(--fc-accent);background:#fff5f5;}",
    ".fc-wallet-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;}",
    ".fc-steps{display:flex;gap:6px;margin-bottom:6px;}",
    ".fc-step-dot{flex:1;height:4px;border-radius:2px;background:#eee;}",
    ".fc-step-dot.fc-step-active{background:var(--fc-accent);}",
    ".fc-qr-wrap{text-align:center;padding:6px 0 4px;}",
    ".fc-qr-box{display:inline-block;padding:14px;background:#fff;border:1px solid #eee;border-radius:10px;}",
    ".fc-qr-amount{font-size:24px;font-weight:800;color:var(--fc-dark);margin-top:14px;}",
    ".fc-qr-note{color:#888;font-size:12px;margin-top:6px;}",
    ".fc-qr-ref{color:#555;font-size:13px;margin-top:4px;font-family:monospace;}",
    ".fc-demo-flag{background:#fff3cd;color:#8a6d1d;font-size:11px;padding:6px 10px;border-radius:6px;margin-top:14px;line-height:1.5;text-align:left;}",
    ".fc-confirm{text-align:center;padding:10px 0 4px;}",
    ".fc-confirm .fc-tick{width:56px;height:56px;border-radius:50%;background:#e5f8ee;color:#1aa260;font-size:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}",
    ".fc-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1e1e1e;color:#fff;padding:11px 20px;border-radius:6px;font-size:14px;opacity:0;transition:all .25s;z-index:10000;pointer-events:none;}",
    ".fc-toast.fc-toast-show{opacity:1;transform:translateX(-50%) translateY(0);}",
    ".fc-clickable{cursor:pointer;}",
    "@media(max-width:480px){.fc-wallets{grid-template-columns:1fr;}}"
  ].join("\n");

  var styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------------------------------------------------------------------
     4. MODAL MARKUP (injected once)
  --------------------------------------------------------------------- */
  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<div class="fc-overlay" id="fcProductOverlay">' +
      '<div class="fc-modal fc-modal-sm">' +
        '<div class="fc-modal-head"><h3>Product Details</h3><button class="fc-close" data-fc-close="fcProductOverlay">&times;</button></div>' +
        '<div class="fc-modal-body" id="fcProductBody"></div>' +
      '</div>' +
    '</div>' +

    '<div class="fc-overlay" id="fcCartOverlay">' +
      '<div class="fc-modal fc-modal-md">' +
        '<div class="fc-modal-head"><h3 id="fcCartTitle">Your Cart</h3><button class="fc-close" data-fc-close="fcCartOverlay">&times;</button></div>' +
        '<div class="fc-modal-body" id="fcCartBody"></div>' +
        '<div class="fc-modal-foot" id="fcCartFoot"></div>' +
      '</div>' +
    '</div>' +

    '<div class="fc-toast" id="fcToast"></div>';
  document.body.appendChild(wrap);

  var productOverlay = document.getElementById("fcProductOverlay");
  var productBody = document.getElementById("fcProductBody");
  var cartOverlay = document.getElementById("fcCartOverlay");
  var cartTitle = document.getElementById("fcCartTitle");
  var cartBody = document.getElementById("fcCartBody");
  var cartFoot = document.getElementById("fcCartFoot");
  var toastEl = document.getElementById("fcToast");

  var checkoutState = { wallet: null, name: "", phone: "" };

  function openOverlay(el) { el.classList.add("fc-open"); }
  function closeOverlay(el) { el.classList.remove("fc-open"); }

  document.addEventListener("click", function (e) {
    var closeBtn = e.target.closest("[data-fc-close]");
    if (closeBtn) {
      closeOverlay(document.getElementById(closeBtn.getAttribute("data-fc-close")));
    }
    if (e.target === productOverlay) closeOverlay(productOverlay);
    if (e.target === cartOverlay) closeOverlay(cartOverlay);
  });

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("fc-toast-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toastEl.classList.remove("fc-toast-show");
    }, 2200);
  }

  function renderBadge() {
    var count = Cart.count();
    document.querySelectorAll(".cart_count_badge").forEach(function (b) {
      b.textContent = count;
      b.style.display = count > 0 ? "flex" : "none";
    });
  }

  /* ---------------------------------------------------------------------
     5. PRODUCT VIEW MODAL
  --------------------------------------------------------------------- */
  function openProductView(id) {
    var p = PRODUCTS[id];
    if (!p) return;
    productBody.innerHTML =
      '<img class="fc-pv-img" src="' + p.img + '" alt="' + p.name + '">' +
      '<span class="fc-pv-cat">' + p.category + '</span>' +
      '<div class="fc-pv-name">' + p.name + '</div>' +
      '<p class="fc-pv-desc">' + p.desc + '</p>' +
      '<div class="fc-row-between">' +
        '<div class="fc-pv-price">' + money(p.price) + '</div>' +
        '<div class="fc-qty">' +
          '<button type="button" data-fc-pvqty="-1">&minus;</button>' +
          '<input type="text" id="fcPvQtyInput" value="1" inputmode="numeric">' +
          '<button type="button" data-fc-pvqty="1">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="fc-btn fc-btn-primary fc-btn-block" id="fcPvAddBtn">Add to Cart</button>';

    var qtyInput = document.getElementById("fcPvQtyInput");
    productBody.querySelectorAll("[data-fc-pvqty]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var delta = parseInt(btn.getAttribute("data-fc-pvqty"), 10);
        var val = Math.max(1, (parseInt(qtyInput.value, 10) || 1) + delta);
        qtyInput.value = val;
      });
    });
    document.getElementById("fcPvAddBtn").addEventListener("click", function () {
      var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      Cart.add(p.id, qty);
      toast(p.name + " added to cart");
      closeOverlay(productOverlay);
    });

    openOverlay(productOverlay);
  }

  /* ---------------------------------------------------------------------
     6. CART / CHECKOUT MODAL — panels: cart -> checkout -> qr -> confirm
  --------------------------------------------------------------------- */
  function stepsHtml(active) {
    var labels = [1, 2, 3];
    return '<div class="fc-steps">' + labels.map(function (n) {
      return '<div class="fc-step-dot' + (n <= active ? ' fc-step-active' : '') + '"></div>';
    }).join('') + '</div>';
  }

  function renderCartPanel() {
    cartTitle.textContent = "Your Cart";
    var items = Cart.get();

    if (items.length === 0) {
      cartBody.innerHTML = '<div class="fc-empty">Your cart is empty.<br>Browse the menu and add something tasty!</div>';
      cartFoot.innerHTML = '<button class="fc-btn fc-btn-ghost" data-fc-close="fcCartOverlay">Close</button>';
      return;
    }

    var rows = items.map(function (i) {
      var p = PRODUCTS[i.id];
      if (!p) return "";
      return (
        '<div class="fc-cart-item" data-fc-item="' + p.id + '">' +
          '<img src="' + p.img + '" alt="' + p.name + '">' +
          '<div class="fc-ci-info">' +
            '<div class="fc-ci-name">' + p.name + '</div>' +
            '<div class="fc-ci-unit">' + money(p.price) + ' each</div>' +
            '<div class="fc-qty" style="margin-top:6px;">' +
              '<button type="button" data-fc-cartqty="-1">&minus;</button>' +
              '<input type="text" value="' + i.qty + '" data-fc-qtyinput readonly>' +
              '<button type="button" data-fc-cartqty="1">+</button>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-weight:700;">' + money(p.price * i.qty) + '</div>' +
            '<button class="fc-ci-remove" data-fc-remove>Remove</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    var total = Cart.total();
    cartBody.innerHTML =
      rows +
      '<div class="fc-summary-line"><span>Subtotal</span><span>' + money(total) + '</span></div>' +
      '<div class="fc-summary-total"><span>Total</span><span>' + money(total) + '</span></div>';

    cartFoot.innerHTML =
      '<button class="fc-btn fc-btn-ghost" data-fc-close="fcCartOverlay">Keep Browsing</button>' +
      '<button class="fc-btn fc-btn-primary" id="fcToCheckoutBtn">Proceed to Checkout</button>';

    document.getElementById("fcToCheckoutBtn").addEventListener("click", renderCheckoutPanel);
  }

  function renderCheckoutPanel() {
    cartTitle.textContent = "Checkout";
    var total = Cart.total();

    cartBody.innerHTML =
      stepsHtml(2) +
      '<div class="fc-field"><label>Name</label><input type="text" id="fcName" placeholder="Your name" value="' + checkoutState.name + '"></div>' +
      '<div class="fc-field"><label>Mobile Number</label><input type="tel" id="fcPhone" placeholder="09XXXXXXXXX" value="' + checkoutState.phone + '"></div>' +
      '<div class="fc-field">' +
        '<label>Pay with</label>' +
        '<div class="fc-wallets" id="fcWallets">' +
          EWALLETS.map(function (w) {
            return (
              '<div class="fc-wallet' + (checkoutState.wallet === w.id ? ' fc-wallet-selected' : '') + '" data-fc-wallet="' + w.id + '">' +
                '<span class="fc-wallet-dot" style="background:' + w.swatch + '"></span>' + w.name +
              '</div>'
            );
          }).join("") +
        '</div>' +
      '</div>' +
      '<div class="fc-summary-total" style="margin-top:20px;"><span>Total Due</span><span>' + money(total) + '</span></div>';

    cartFoot.innerHTML =
      '<button class="fc-btn fc-btn-ghost" id="fcBackToCart">Back to Cart</button>' +
      '<button class="fc-btn fc-btn-primary" id="fcGenQrBtn">Generate QR Code</button>';

    document.getElementById("fcBackToCart").addEventListener("click", renderCartPanel);

    cartBody.querySelectorAll("[data-fc-wallet]").forEach(function (el) {
      el.addEventListener("click", function () {
        checkoutState.wallet = el.getAttribute("data-fc-wallet");
        cartBody.querySelectorAll("[data-fc-wallet]").forEach(function (x) {
          x.classList.toggle("fc-wallet-selected", x === el);
        });
      });
    });

    document.getElementById("fcGenQrBtn").addEventListener("click", function () {
      checkoutState.name = document.getElementById("fcName").value.trim();
      checkoutState.phone = document.getElementById("fcPhone").value.trim();
      if (!checkoutState.wallet) {
        toast("Please choose an e-wallet first");
        return;
      }
      renderQrPanel();
    });
  }

  function buildPayQrPayload(ref, total, walletName) {
    // Demo payload only — replace with the string / URL your payment
    // provider's API returns when you wire up real GCash / Maya / GrabPay QR.
    return (
      "FEANE-PAY\n" +
      "Wallet:" + walletName + "\n" +
      "RefNo:" + ref + "\n" +
      "Amount:" + total.toFixed(2) + "\n" +
      "Customer:" + (checkoutState.name || "Guest")
    );
  }

  function renderQrPanel() {
    cartTitle.textContent = "Scan to Pay";
    var total = Cart.total();
    var wallet = EWALLETS.find(function (w) { return w.id === checkoutState.wallet; });
    var ref = checkoutState.ref || (checkoutState.ref = orderRef());

    cartBody.innerHTML =
      stepsHtml(3) +
      '<div class="fc-qr-wrap">' +
        '<div class="fc-qr-box" id="fcQrCanvas"></div>' +
        '<div class="fc-qr-amount">' + money(total) + '</div>' +
        '<div class="fc-qr-note">Scan with your <strong>' + wallet.name + '</strong> app to pay</div>' +
        '<div class="fc-qr-ref">Ref: ' + ref + '</div>' +
        '<div class="fc-demo-flag">This is a demo QR for preview purposes — it is not connected to a real ' + wallet.name + ' merchant account. Wire up your payment provider\u2019s API to generate a live payment QR.</div>' +
      '</div>';

    cartFoot.innerHTML =
      '<button class="fc-btn fc-btn-ghost" id="fcBackToCheckout">Cancel</button>' +
      '<button class="fc-btn fc-btn-primary" id="fcSimPaidBtn">I\u2019ve Paid (Simulate)</button>';

    document.getElementById("fcBackToCheckout").addEventListener("click", renderCheckoutPanel);
    document.getElementById("fcSimPaidBtn").addEventListener("click", function () {
      renderConfirmPanel(ref, total, wallet.name);
    });

    var qrTarget = document.getElementById("fcQrCanvas");
    qrTarget.innerHTML = "";
    if (window.QRCode) {
      new QRCode(qrTarget, {
        text: buildPayQrPayload(ref, total, wallet.name),
        width: 176,
        height: 176,
        colorDark: "#1e1e1e",
        colorLight: "#ffffff"
      });
    } else {
      qrTarget.innerHTML = '<div style="width:176px;height:176px;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">QR library failed to load</div>';
    }
  }

  function renderConfirmPanel(ref, total, walletName) {
    cartTitle.textContent = "Order Confirmed";
    cartBody.innerHTML =
      '<div class="fc-confirm">' +
        '<div class="fc-tick">&#10003;</div>' +
        '<h3 style="margin:0 0 6px;">Thank you' + (checkoutState.name ? ", " + checkoutState.name : "") + '!</h3>' +
        '<p style="color:#666;font-size:14px;">Your order has been placed and paid via <strong>' + walletName + '</strong>.</p>' +
        '<div class="fc-summary-total" style="justify-content:center;gap:10px;"><span>Total Paid</span><span>' + money(total) + '</span></div>' +
        '<div class="fc-qr-ref" style="margin-top:8px;">Order Ref: ' + ref + '</div>' +
      '</div>';
    cartFoot.innerHTML = '<button class="fc-btn fc-btn-primary fc-btn-block" id="fcDoneBtn">Done</button>';

    Cart.clear();
    checkoutState = { wallet: null, name: checkoutState.name, phone: checkoutState.phone };

    document.getElementById("fcDoneBtn").addEventListener("click", function () {
      closeOverlay(cartOverlay);
    });
  }

  /* ---------------------------------------------------------------------
     7. EVENT DELEGATION — product cards on index.html / menu.html
  --------------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    // Quick add-to-cart via the small cart-shaped icon already on each card
    var quickAddLink = e.target.closest(".options a");
    if (quickAddLink) {
      var box = quickAddLink.closest("[data-product-id]");
      if (box) {
        e.preventDefault();
        var pid = box.getAttribute("data-product-id");
        Cart.add(pid, 1);
        var p = PRODUCTS[pid];
        toast((p ? p.name : "Item") + " added to cart");
        return;
      }
    }

    // Open the product view modal when clicking the image or title
    var viewTrigger = e.target.closest(".img-box, h5");
    if (viewTrigger) {
      var vbox = viewTrigger.closest("[data-product-id]");
      if (vbox) {
        openProductView(vbox.getAttribute("data-product-id"));
        return;
      }
    }

    // Cart icon in header
    if (e.target.closest("#cart_toggle_btn")) {
      e.preventDefault();
      renderCartPanel();
      openOverlay(cartOverlay);
      return;
    }

    // Cart line item qty +/- and remove (delegated, cart is re-rendered often)
    var qtyBtn = e.target.closest("[data-fc-cartqty]");
    if (qtyBtn) {
      var itemEl = qtyBtn.closest("[data-fc-item]");
      var id = itemEl.getAttribute("data-fc-item");
      var current = Cart.get().find(function (i) { return i.id === id; });
      if (current) {
        var next = current.qty + parseInt(qtyBtn.getAttribute("data-fc-cartqty"), 10);
        Cart.setQty(id, next);
        renderCartPanel();
      }
      return;
    }
    var removeBtn = e.target.closest("[data-fc-remove]");
    if (removeBtn) {
      var ritemEl = removeBtn.closest("[data-fc-item]");
      Cart.remove(ritemEl.getAttribute("data-fc-item"));
      renderCartPanel();
      return;
    }
  });

  /* Mark the whole product card as clickable for hover affordance */
  document.querySelectorAll("[data-product-id]").forEach(function (el) {
    el.classList.add("fc-clickable");
  });

  renderBadge();
})();