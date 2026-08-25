// Main application logic for Feane cart system

document.addEventListener('DOMContentLoaded', function () {
  // Inject product modal and checkout modal into body if not present
  if (!document.getElementById('productModal')) {
    injectModals();
  }

  // Bind product click and add-to-cart on menu items
  bindProductCards();

  // Update cart badge
  if (typeof updateCartBadge === 'function') updateCartBadge();
});

function injectModals() {
  const modalHTML = `
  <!-- Product Detail Modal -->
  <div class="modal fade" id="productModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title" id="productModalTitle">Product</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-5 text-center">
              <img id="productModalImg" src="" alt="" class="img-fluid rounded" style="max-height:280px;object-fit:contain;">
            </div>
            <div class="col-md-7">
              <h4 id="productModalName"></h4>
              <p class="text-muted" id="productModalCategory"></p>
              <h3 class="text-primary" id="productModalPrice"></h3>
              <p id="productModalDesc"></p>
              <div class="d-flex align-items-center mb-3">
                <label class="mr-2 mb-0">Qty:</label>
                <input type="number" id="productModalQty" class="form-control" value="1" min="1" max="20" style="width:80px;">
              </div>
              <button class="btn btn-warning btn-lg" id="productModalAddBtn">
                <i class="fa fa-shopping-cart"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Cart Sidebar / Offcanvas style modal -->
  <div class="modal fade" id="cartModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="fa fa-shopping-cart"></i> Your Cart</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" id="cartModalBody">
          <!-- filled dynamically -->
        </div>
        <div class="modal-footer d-flex justify-content-between">
          <h5 class="mb-0">Total: <span id="cartModalTotal">$0.00</span></h5>
          <div>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Continue Shopping</button>
            <button type="button" class="btn btn-warning" id="checkoutBtn" disabled>Checkout</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Checkout Modal -->
  <div class="modal fade" id="checkoutModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Checkout & Payment</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div id="checkoutStep1">
            <h6 class="mb-3">Customer Information</h6>
            <div class="form-row">
              <div class="form-group col-md-6">
                <label>Full Name *</label>
                <input type="text" class="form-control" id="checkoutName" required>
              </div>
              <div class="form-group col-md-6">
                <label>Phone Number *</label>
                <input type="tel" class="form-control" id="checkoutPhone" required>
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" id="checkoutEmail">
            </div>
            <div class="form-group">
              <label>Delivery Address (optional for dine-in)</label>
              <textarea class="form-control" id="checkoutAddress" rows="2"></textarea>
            </div>

            <h6 class="mt-4 mb-3">Select E-Wallet Payment Method</h6>
            <div class="ewallet-options row">
              <div class="col-6 col-md-3 mb-2">
                <label class="ewallet-card">
                  <input type="radio" name="ewallet" value="GCash" checked>
                  <div class="ewallet-box">
                    <strong>GCash</strong>
                    <small>Mobile Wallet</small>
                  </div>
                </label>
              </div>
              <div class="col-6 col-md-3 mb-2">
                <label class="ewallet-card">
                  <input type="radio" name="ewallet" value="PayMaya">
                  <div class="ewallet-box">
                    <strong>PayMaya</strong>
                    <small>Maya Wallet</small>
                  </div>
                </label>
              </div>
              <div class="col-6 col-md-3 mb-2">
                <label class="ewallet-card">
                  <input type="radio" name="ewallet" value="GrabPay">
                  <div class="ewallet-box">
                    <strong>GrabPay</strong>
                    <small>Grab Wallet</small>
                  </div>
                </label>
              </div>
              <div class="col-6 col-md-3 mb-2">
                <label class="ewallet-card">
                  <input type="radio" name="ewallet" value="ShopeePay">
                  <div class="ewallet-box">
                    <strong>ShopeePay</strong>
                    <small>Shopee Wallet</small>
                  </div>
                </label>
              </div>
            </div>

            <div class="mt-4 text-right">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-warning" id="proceedToPayBtn">Proceed to Pay</button>
            </div>
          </div>

          <div id="checkoutStep2" style="display:none;">
            <div class="text-center">
              <h5>Scan QR Code to Pay</h5>
              <p class="text-muted">Pay with <strong id="selectedWalletName">GCash</strong></p>
              <div id="qrcodeContainer" class="my-3 d-flex justify-content-center"></div>
              <p class="mb-1">Amount: <strong id="payAmount">$0.00</strong></p>
              <p class="small text-muted">Order Ref: <span id="orderRef"></span></p>
              <p class="small">After paying, click the button below to confirm.</p>
              <button type="button" class="btn btn-success btn-lg mt-2" id="confirmPaymentBtn">
                <i class="fa fa-check"></i> I Have Paid - Confirm Order
              </button>
              <br>
              <button type="button" class="btn btn-link mt-2" id="backToCheckoutBtn">← Back</button>
            </div>
          </div>

          <div id="checkoutStep3" style="display:none;">
            <div class="text-center" id="receiptContent">
              <!-- Receipt generated here -->
            </div>
            <div class="text-center mt-3">
              <button type="button" class="btn btn-primary" onclick="window.print()">
                <i class="fa fa-print"></i> Print Receipt
              </button>
              <button type="button" class="btn btn-secondary" data-dismiss="modal" id="closeReceiptBtn">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Bind events after injection
  document.getElementById('productModalAddBtn').addEventListener('click', onAddFromModal);
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
  document.getElementById('proceedToPayBtn').addEventListener('click', proceedToPayment);
  document.getElementById('confirmPaymentBtn').addEventListener('click', confirmPayment);
  document.getElementById('backToCheckoutBtn').addEventListener('click', () => {
    document.getElementById('checkoutStep2').style.display = 'none';
    document.getElementById('checkoutStep1').style.display = 'block';
  });
  document.getElementById('closeReceiptBtn').addEventListener('click', () => {
    clearCart();
    renderCartModal();
  });
}

function bindProductCards() {
  // Make food boxes clickable for product view
  document.querySelectorAll('.food_section .box, .filters-content .box').forEach((box, index) => {
    // Assign product id based on order if not already set
    const img = box.querySelector('.img-box img');
    if (!img) return;

    // Try to match by image filename
    const src = img.getAttribute('src') || '';
    const match = src.match(/f(\d+)\.png/);
    let productId = match ? parseInt(match[1]) : (index + 1);

    box.setAttribute('data-product-id', productId);
    box.style.cursor = 'pointer';

    // Click on box (except cart link) opens product modal
    box.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; // ignore cart icon clicks for now
      openProductModal(productId);
    });

    // Enhance the existing cart SVG links
    const cartLink = box.querySelector('.options a');
    if (cartLink) {
      cartLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (addToCart(productId, 1)) {
          showToast('Added to cart!');
        }
      });
    }
  });
}

function openProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  document.getElementById('productModalTitle').textContent = product.name;
  document.getElementById('productModalName').textContent = product.name;
  document.getElementById('productModalCategory').textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.getElementById('productModalPrice').textContent = '$' + product.price.toFixed(2);
  document.getElementById('productModalDesc').textContent = product.description;
  document.getElementById('productModalImg').src = product.image;
  document.getElementById('productModalImg').alt = product.name;
  document.getElementById('productModalQty').value = 1;
  document.getElementById('productModalAddBtn').setAttribute('data-id', product.id);

  $('#productModal').modal('show');
}

function onAddFromModal() {
  const id = parseInt(document.getElementById('productModalAddBtn').getAttribute('data-id'));
  const qty = parseInt(document.getElementById('productModalQty').value) || 1;
  if (addToCart(id, qty)) {
    showToast('Added ' + qty + ' item(s) to cart!');
    $('#productModal').modal('hide');
  }
}

function openCartModal() {
  renderCartModal();
  $('#cartModal').modal('show');
}

function renderCartModal() {
  const cart = getCart();
  const body = document.getElementById('cartModalBody');
  const totalEl = document.getElementById('cartModalTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cart.length === 0) {
    body.innerHTML = '<p class="text-center text-muted py-4">Your cart is empty.</p>';
    totalEl.textContent = '$0.00';
    checkoutBtn.disabled = true;
    return;
  }

  let html = '<table class="table table-sm"><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>';
  cart.forEach(item => {
    const sub = item.price * item.quantity;
    html += `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <img src="${item.image}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:6px;margin-right:10px;">
            <span>${item.name}</span>
          </div>
        </td>
        <td>$${item.price.toFixed(2)}</td>
        <td>
          <input type="number" class="form-control form-control-sm cart-qty" data-id="${item.id}" value="${item.quantity}" min="1" max="20" style="width:70px;">
        </td>
        <td>$${sub.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}" title="Remove">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });
  html += '</tbody></table>';
  body.innerHTML = html;
  totalEl.textContent = '$' + getCartTotal().toFixed(2);
  checkoutBtn.disabled = false;

  // Bind qty change and remove
  body.querySelectorAll('.cart-qty').forEach(input => {
    input.addEventListener('change', function () {
      updateQuantity(this.dataset.id, parseInt(this.value));
      renderCartModal();
    });
  });
  body.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function () {
      removeFromCart(this.dataset.id);
      renderCartModal();
      showToast('Item removed');
    });
  });
}

function openCheckout() {
  $('#cartModal').modal('hide');
  // Reset steps
  document.getElementById('checkoutStep1').style.display = 'block';
  document.getElementById('checkoutStep2').style.display = 'none';
  document.getElementById('checkoutStep3').style.display = 'none';
  $('#checkoutModal').modal('show');
}

let currentOrderRef = '';

function proceedToPayment() {
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  if (!name || !phone) {
    alert('Please enter your name and phone number.');
    return;
  }

  const wallet = document.querySelector('input[name="ewallet"]:checked').value;
  const total = getCartTotal();
  currentOrderRef = 'FEANE-' + Date.now().toString(36).toUpperCase();

  document.getElementById('selectedWalletName').textContent = wallet;
  document.getElementById('payAmount').textContent = '$' + total.toFixed(2);
  document.getElementById('orderRef').textContent = currentOrderRef;

  // Generate QR code
  const qrContainer = document.getElementById('qrcodeContainer');
  qrContainer.innerHTML = '';
  const canvas = document.createElement('canvas');
  qrContainer.appendChild(canvas);

  // Payment payload for QR (simulated)
  const payload = JSON.stringify({
    merchant: 'Feane Restaurant',
    amount: total.toFixed(2),
    currency: 'USD',
    reference: currentOrderRef,
    wallet: wallet,
    timestamp: new Date().toISOString()
  });

  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, payload, { width: 220, margin: 2 }, function (err) {
      if (err) console.error(err);
    });
  } else {
    // Fallback text
    qrContainer.innerHTML = '<div class="p-4 border rounded bg-light"><code style="word-break:break-all;">' + payload + '</code><p class="mt-2 small">QR library not loaded. Use this data for payment.</p></div>';
  }

  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'block';
}

function confirmPayment() {
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  const wallet = document.querySelector('input[name="ewallet"]:checked').value;
  const cart = getCart();
  const total = getCartTotal();

  const order = {
    ref: currentOrderRef,
    date: new Date().toLocaleString(),
    customer: { name, phone, email, address },
    paymentMethod: wallet,
    items: cart.map(i => ({ ...i })),
    total: total,
    status: 'Paid'
  };

  saveOrder(order);

  // Generate receipt HTML
  let receipt = `
    <div class="receipt" style="max-width:400px;margin:0 auto;text-align:left;font-family:monospace;">
      <div class="text-center mb-3">
        <h4 style="margin:0;">FEANE</h4>
        <p class="mb-0 small">Fast Food Restaurant</p>
        <p class="small text-muted">Official Receipt</p>
      </div>
      <hr>
      <p><strong>Order Ref:</strong> ${order.ref}</p>
      <p><strong>Date:</strong> ${order.date}</p>
      <p><strong>Customer:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      ${email ? '<p><strong>Email:</strong> ' + email + '</p>' : ''}
      ${address ? '<p><strong>Address:</strong> ' + address + '</p>' : ''}
      <p><strong>Payment:</strong> ${wallet}</p>
      <hr>
      <table style="width:100%;font-size:14px;">
        <thead>
          <tr><th style="text-align:left;">Item</th><th>Qty</th><th style="text-align:right;">Amount</th></tr>
        </thead>
        <tbody>
  `;
  order.items.forEach(item => {
    receipt += `<tr>
      <td>${item.name}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`;
  });
  receipt += `
        </tbody>
      </table>
      <hr>
      <p style="text-align:right;font-size:18px;"><strong>TOTAL: $${total.toFixed(2)}</strong></p>
      <hr>
      <p class="text-center small text-muted">Thank you for dining with Feane!<br>Please keep this receipt for your records.</p>
      <div class="text-center mt-2" id="receiptQR"></div>
    </div>
  `;

  document.getElementById('receiptContent').innerHTML = receipt;

  // Small QR on receipt with order ref
  if (typeof QRCode !== 'undefined') {
    const rqr = document.createElement('canvas');
    document.getElementById('receiptQR').appendChild(rqr);
    QRCode.toCanvas(rqr, order.ref, { width: 100, margin: 1 });
  }

  document.getElementById('checkoutStep2').style.display = 'none';
  document.getElementById('checkoutStep3').style.display = 'block';

  // Clear cart after successful order
  clearCart();
}

function showToast(message) {
  // Simple toast
  let toast = document.getElementById('feaneToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'feaneToast';
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ffbe33;color:#222;padding:12px 24px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:600;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// Make cart icon open cart modal
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.cart_link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openCartModal();
    });
    // Add badge
    if (!link.querySelector('.cart-count')) {
      const badge = document.createElement('span');
      badge.className = 'cart-count';
      badge.style.cssText = 'position:absolute;top:-8px;right:-10px;background:#ffbe33;color:#222;border-radius:50%;width:20px;height:20px;font-size:12px;line-height:20px;text-align:center;font-weight:bold;display:none;';
      link.style.position = 'relative';
      link.appendChild(badge);
    }
  });
});