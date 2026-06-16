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
                    
                    <div class="checkout-summary-details" style="margin-top: 14px; display: grid; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--color-muted);">
                            <span>Total Harga Produk</span>
                            <span id="cartSubtotal" data-js="cartSubtotal">Rp 0</span>
                        </div>
                        <div id="shippingRow" data-js="shippingRow" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--color-muted);" hidden>
                            <span>Ongkos Kirim</span>
                            <span id="shippingFee" data-js="shippingFee">Rp 0</span>
                        </div>
                        <div id="minDeliveryNotice" data-js="minDeliveryNotice" style="font-size: 0.85rem; color: var(--color-danger); margin-top: 4px;" hidden>
                            * Minimal belanja untuk delivery adalah Rp 50.000
                        </div>
                    </div>

                    <div class="cart-total" style="margin-top: 14px;">
                        <strong>Total Pembayaran</strong>
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
                    <h3 id="addressTitle">Alamat Pengiriman</h3>
                    
                    <div style="margin-top: 14px;">
                        <label for="deliveryKecamatan" style="font-weight: 700; font-size: 0.9rem; color: var(--color-ink); display: block; margin-bottom: 6px;">Kecamatan</label>
                        <select id="deliveryKecamatan" name="kecamatan" data-js="deliveryKecamatan" class="form-input" style="min-height: 48px; padding: 0 14px; margin-top: 0; width: 100%; border-radius: 8px; border: 1px solid var(--color-line); background: #ffffff;" autocomplete="address-level2">
                            <option value="" disabled selected>Pilih Kecamatan...</option>
                            <optgroup label="Surabaya Pusat">
                                <option value="Bubutan" data-fee="55000">Bubutan (11 km, Ongkir Rp 55.000)</option>
                                <option value="Genteng" data-fee="50000">Genteng (10 km, Ongkir Rp 50.000)</option>
                                <option value="Simokerto" data-fee="65000">Simokerto (13 km, Ongkir Rp 65.000)</option>
                                <option value="Tegalsari" data-fee="45000">Tegalsari (9 km, Ongkir Rp 45.000)</option>
                            </optgroup>
                            <optgroup label="Surabaya Timur">
                                <option value="Gubeng" data-fee="45000">Gubeng (9 km, Ongkir Rp 45.000)</option>
                                <option value="Gunung Anyar" data-fee="50000">Gunung Anyar (10 km, Ongkir Rp 50.000)</option>
                                <option value="Mulyorejo" data-fee="65000">Mulyorejo (13 km, Ongkir Rp 65.000)</option>
                                <option value="Rungkut" data-fee="45000">Rungkut (9 km, Ongkir Rp 45.000)</option>
                                <option value="Sukolilo" data-fee="55000">Sukolilo (11 km, Ongkir Rp 55.000)</option>
                                <option value="Tambaksari" data-fee="55000">Tambaksari (11 km, Ongkir Rp 55.000)</option>
                                <option value="Tenggilis Mejoyo" data-fee="40000">Tenggilis Mejoyo (8 km, Ongkir Rp 40.000)</option>
                            </optgroup>
                            <optgroup label="Surabaya Barat">
                                <option value="Asemrowo" data-fee="75000">Asemrowo (15 km, Ongkir Rp 75.000)</option>
                                <option value="Benowo" data-fee="125000">Benowo (25 km, Ongkir Rp 125.000)</option>
                                <option value="Dukuh Pakis" data-fee="35000">Dukuh Pakis (7 km, Ongkir Rp 35.000)</option>
                                <option value="Karang Pilang" data-fee="20000">Karang Pilang (4 km, Ongkir Rp 20.000)</option>
                                <option value="Lakarsantri" data-fee="90000">Lakarsantri (18 km, Ongkir Rp 90.000)</option>
                                <option value="Sambikerep" data-fee="95000">Sambikerep (19 km, Ongkir Rp 95.000)</option>
                                <option value="Tandes" data-fee="70000">Tandes (14 km, Ongkir Rp 70.000)</option>
                            </optgroup>
                            <optgroup label="Surabaya Utara">
                                <option value="Bulak" data-fee="90000">Bulak (18 km, Ongkir Rp 90.000)</option>
                                <option value="Kenjeran" data-fee="80000">Kenjeran (16 km, Ongkir Rp 80.000)</option>
                                <option value="Krembangan" data-fee="75000">Krembangan (15 km, Ongkir Rp 75.000)</option>
                                <option value="Pabean Cantian" data-fee="80000">Pabean Cantian (16 km, Ongkir Rp 80.000)</option>
                                <option value="Semampir" data-fee="85000">Semampir (17 km, Ongkir Rp 85.000)</option>
                            </optgroup>
                            <optgroup label="Surabaya Selatan">
                                <option value="Gayungan" data-fee="10000">Gayungan (2 km, Ongkir Rp 10.000)</option>
                                <option value="Jambangan" data-fee="0">Jambangan (0 km, Ongkir Rp 0)</option>
                                <option value="Pakal" data-fee="110000">Pakal (22 km, Ongkir Rp 110.000)</option>
                                <option value="Sawahan" data-fee="35000">Sawahan (7 km, Ongkir Rp 35.000)</option>
                                <option value="Sukomanunggal" data-fee="50000">Sukomanunggal (10 km, Ongkir Rp 50.000)</option>
                                <option value="Wiyung" data-fee="30000">Wiyung (6 km, Ongkir Rp 30.000)</option>
                                <option value="Wonocolo" data-fee="15000">Wonocolo (3 km, Ongkir Rp 15.000)</option>
                                <option value="Wonokromo" data-fee="25000">Wonokromo (5 km, Ongkir Rp 25.000)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div style="margin-top: 14px;">
                        <label for="deliveryDusun" style="font-weight: 700; font-size: 0.9rem; color: var(--color-ink); display: block; margin-bottom: 6px;">Dusun / Desa</label>
                        <input type="text" id="deliveryDusun" name="dusun" data-js="deliveryDusun" class="form-input" style="min-height: 48px; padding: 0 14px; margin-top: 0; width: 100%; border-radius: 8px; border: 1px solid var(--color-line); background: #ffffff;" placeholder="Masukkan nama dusun/desa..." autocomplete="address-line3">
                    </div>

                    <div style="margin-top: 14px;">
                        <label for="deliveryAddress" style="font-weight: 700; font-size: 0.9rem; color: var(--color-ink); display: block; margin-bottom: 6px;">Alamat Lengkap (RT/RW, No. Rumah, Petunjuk)</label>
                        <textarea id="deliveryAddress" name="address" data-js="deliveryAddress" class="form-input" placeholder="Masukkan alamat lengkap detail Anda..." rows="3" style="min-height: 80px; margin-top: 0; width: 100%; resize: vertical; border-radius: 8px; border: 1px solid var(--color-line); background: #ffffff; padding: 14px;" autocomplete="street-address"></textarea>
                    </div>
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

                    <!-- Payment Instructions & Upload Proof (Simulation) -->
                    <div id="paymentInstructions" data-js="paymentInstructions" style="margin-top: 18px; padding: 16px; border: 1px solid var(--color-line); border-radius: 8px; background: var(--color-soft);">
                        <!-- QRIS Instruction -->
                        <div id="qrisInstruction" data-js="qrisInstruction" style="text-align: center;">
                            <p style="font-weight: 700; color: var(--color-ink); font-size: 0.95rem; margin-bottom: 8px;">Scan Kode QRIS Diana:</p>
                            <img src="images/Qris.png" alt="QRIS Code Toko Sembako Diana" style="width: 220px; height: auto; margin: 0 auto 10px; display: block; border: 4px solid #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                            <p style="font-size: 0.82rem; color: var(--color-muted);">Silakan scan QRIS di atas untuk melakukan pembayaran otomatis.</p>
                        </div>
                        
                        <!-- Bank Transfer Instruction -->
                        <div id="transferInstruction" data-js="transferInstruction" style="display: none;">
                            <p style="font-weight: 700; color: var(--color-ink); font-size: 0.95rem; margin-bottom: 8px;">Transfer Bank Manual:</p>
                            <div style="border-radius: 6px; padding: 12px; background: #ffffff; border: 1px solid var(--color-line); margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="font-size: 0.85rem; color: var(--color-muted);">Bank:</span>
                                    <strong style="font-size: 0.85rem; color: var(--color-ink);">BRI</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <span style="font-size: 0.85rem; color: var(--color-muted);">No. Rekening:</span>
                                    <strong style="font-size: 0.85rem; color: var(--color-ink);">700201003304503</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 0.85rem; color: var(--color-muted);">A/n:</span>
                                    <strong style="font-size: 0.85rem; color: var(--color-ink);">Diana</strong>
                                </div>
                            </div>
                            <p style="font-size: 0.82rem; color: var(--color-muted);">Silakan transfer ke rekening di atas dan simpan struk transfer Anda.</p>
                        </div>

                        <!-- Upload Proof Input -->
                        <div style="margin-top: 14px; border-top: 1px dashed var(--color-line); padding-top: 14px;">
                            <label for="paymentProof" style="font-weight: 700; font-size: 0.9rem; color: var(--color-ink); display: block; margin-bottom: 6px;">Upload Bukti Pembayaran (Simulasi)</label>
                            <input type="file" id="paymentProof" name="paymentProof" data-js="paymentProof" accept="image/*" class="form-input" style="min-height: auto; padding: 10px; margin-top: 0; width: 100%; border-radius: 8px; border: 1px solid var(--color-line); background: #ffffff;">
                            
                            <!-- Proof Image Preview -->
                            <div id="paymentProofPreviewContainer" data-js="paymentProofPreviewContainer" style="display: none; margin-top: 12px; text-align: center;">
                                <p style="font-size: 0.82rem; color: var(--color-primary-dark); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span style="color: var(--color-primary); font-size: 1.1rem;">✓</span> Bukti Pembayaran Terpilih:
                                </p>
                                <img id="paymentProofPreview" data-js="paymentProofPreview" src="" alt="Preview Bukti Transfer" style="max-width: 100%; max-height: 180px; border-radius: 6px; margin-top: 6px; border: 1px solid var(--color-line); object-fit: contain;">
                            </div>
                        </div>
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
