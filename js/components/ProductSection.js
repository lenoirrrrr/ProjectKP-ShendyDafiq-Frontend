export function ProductSection() {
    return `
    <section id="produk" class="section products" aria-labelledby="produkTitle">
        <div class="container">
            <div class="section-heading">
                <p class="section-kicker">Katalog</p>
                <h2 id="produkTitle" class="section-title">Produk Kami</h2>
                <p class="section-subtitle">Pilihan sembako utama untuk kebutuhan rumah tangga Anda.</p>
            </div>

            <div class="products-grid" id="productsGrid" data-js="productsGrid" aria-live="polite"></div>
        </div>
    </section>
    `;
}
