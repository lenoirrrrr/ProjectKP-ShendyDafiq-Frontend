export function Navbar() {
    return `
    <nav class="navbar" aria-label="Navigasi utama">
        <div class="navbar-container">
            <a class="navbar-logo" href="#beranda" aria-label="Toko Sembako Ibu Diana">
                <span class="logo-mark" aria-hidden="true">&#128722;</span>
                <span>Toko Sembako Ibu Diana</span>
            </a>

            <ul class="nav-menu">
                <li><a href="#beranda" class="nav-link">Beranda</a></li>
                <li><a href="#produk" class="nav-link">Produk</a></li>
                <li><a href="#tentang" class="nav-link">Tentang</a></li>
                <li><a href="#kontak" class="nav-link">Kontak</a></li>
                <li><a href="./admin/index.html" class="nav-link">Admin Panel</a></li>
                <li>
                    <button class="nav-link-btn" id="myOrdersBtn" data-js="myOrdersBtn" type="button" style="background: none; border: none; font: inherit; cursor: pointer; color: var(--color-ink);">
                        Pesanan Saya
                    </button>
                </li>
                <li>
                    <button class="cart-btn" id="cartBtn" data-js="cartBtn" type="button" aria-label="Buka keranjang">
                        <span aria-hidden="true">&#128722;</span>
                        <span>Keranjang</span>
                        <span class="cart-badge is-empty" id="cartBadge" data-js="cartBadge">0</span>
                    </button>
                </li>
            </ul>
        </div>
    </nav>
    `;
}
