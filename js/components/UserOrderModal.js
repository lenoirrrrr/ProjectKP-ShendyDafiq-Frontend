export function UserOrderModal() {
    return `
    <div class="modal" id="userOrderModal" data-js="userOrderModal" role="dialog" aria-modal="true" aria-labelledby="userOrderTitle" aria-hidden="true" hidden>
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <div>
                    <p class="modal-kicker">Riwayat Belanja</p>
                    <h2 id="userOrderTitle">Pesanan Saya</h2>
                </div>
                <button class="modal-close" id="closeUserOrderBtn" data-js="closeUserOrderBtn" type="button">&times;</button>
            </div>

            <div class="modal-body">
                <div id="userOrderList" data-js="userOrderList">
                    <div class="empty-cart" style="padding: 2rem; text-align: center;">
                        <p>Memuat riwayat pesanan...</p>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeUserOrderBtn2" data-js="closeUserOrderBtn2" type="button">Tutup</button>
            </div>
        </div>
    </div>
    `;
}
