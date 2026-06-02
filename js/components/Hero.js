export function Hero() {
    return `
    <section id="beranda" class="hero" aria-labelledby="heroTitle">
        <div class="container hero-content">
            <p class="hero-kicker">Belanja sembako harian</p>
            <h1 id="heroTitle" class="hero-title">Toko Sembako Diana</h1>
            <p class="hero-subtitle">
                Produk kebutuhan dapur lengkap, harga ramah, dan siap melayani pesanan take away maupun delivery.
            </p>
            <div class="hero-actions">
                <a href="#produk" class="btn btn-primary">Lihat Produk</a>
                <a href="#kontak" class="btn btn-ghost">Hubungi Kami</a>
            </div>
            <div class="hero-highlights" aria-label="Keunggulan toko">
                <span>Produk pilihan</span>
                <span>Harga terjangkau</span>
                <span>Delivery tersedia</span>
            </div>
        </div>
    </section>
    `;
}
