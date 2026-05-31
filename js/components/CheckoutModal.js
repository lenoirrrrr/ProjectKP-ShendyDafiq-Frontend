export function CheckoutModal() {
    return `
    <div class="modal-overlay" id="modalOverlay" data-js="modalOverlay" hidden></div>

    <div class="modal" id="checkoutModal" data-js="checkoutModal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" aria-hidden="true" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <p class="modal-kicker">Keranjang</p>
                    <h2 id="checkoutTitle">Checkout Pesanan</h2>
                </div>
                <button class="modal-close" id="modalCloseBtn" data-js="modalCloseBtn" type="button" aria-label="Tutup checkout">&times;</button>
            </div>

            <div class="modal-body">
                <section class="checkout-section" aria-labelledby="customerInfoTitle">
                    <h3 id="customerInfoTitle">Informasi Pelanggan</h3>
                    <label for="customerName">
                        <span class="sr-only">Nama Lengkap</span>
                        <input type="text" id="customerName" name="customerName" data-js="customerName" class="form-input" placeholder="Masukkan nama lengkap Anda..." required autocomplete="name">
                    </label>
                </section>

                <section class="checkout-section" aria-labelledby="cartTitle">
                    <h3 id="cartTitle">Produk Pesanan</h3>
                    <div class="cart-items" id="cartItems" data-js="cartItems"></div>
                    <div class="cart-total">
                        <strong>Total Harga</strong>
                        <span id="totalPrice" data-js="totalPrice">Rp 0</span>
                    </div>
                </section>

                <section class="checkout-section" aria-labelledby="pickupTitle">
                    <h3 id="pickupTitle">Metode Pengambilan</h3>
                    <div class="radio-group">
                        <label class="radio-label" for="pickupTakeaway">
                            <input type="radio" id="pickupTakeaway" name="pengambilan" value="takeaway" checked autocomplete="off">
                            <span>Take Away (Ambil di Toko)</span>
                        </label>
                        <label class="radio-label" for="pickupDelivery">
                            <input type="radio" id="pickupDelivery" name="pengambilan" value="delivery" autocomplete="off">
                            <span>Delivery (Diantar ke Rumah)</span>
                        </label>
                    </div>
                </section>

                <section class="checkout-section" id="deliveryAddressSection" data-js="deliveryAddressSection" aria-labelledby="addressTitle" hidden>
                    <label for="deliveryAddress">
                        <h3 id="addressTitle">Alamat Pengiriman</h3>
                        <textarea id="deliveryAddress" name="address" data-js="deliveryAddress" class="form-input" placeholder="Masukkan alamat lengkap Anda..." rows="4" autocomplete="street-address"></textarea>
                    </label>
                </section>

                <section class="checkout-section" aria-labelledby="paymentTitle">
                    <h3 id="paymentTitle">Metode Pembayaran</h3>
                    <div class="radio-group">
                        <label class="radio-label" for="paymentQris">
                            <input type="radio" id="paymentQris" name="pembayaran" value="qris" checked autocomplete="off">
                            <span>&#128179; QRIS</span>
                        </label>
                        <label class="radio-label" for="paymentTransfer">
                            <input type="radio" id="paymentTransfer" name="pembayaran" value="transfer" autocomplete="off">
                            <span>&#127974; Transfer Bank</span>
                        </label>
                    </div>
                </section>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelCheckoutBtn" data-js="cancelCheckoutBtn" type="button">Batal</button>
                <button class="btn btn-primary" id="submitOrderBtn" data-js="submitOrderBtn" type="button">Pesan Sekarang</button>
            </div>
        </div>
    </div>
    `;
}
