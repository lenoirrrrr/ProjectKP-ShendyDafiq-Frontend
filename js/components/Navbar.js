export function Navbar(user = null) {
    const isAdmin = user?.role === "ADMIN";
    
    const adminLink = isAdmin ? `<li><a href="./admin/index.html" class="nav-link">Admin Panel</a></li>` : "";
    
    const authButtons = user ? `
        <li>
            <button class="nav-link-btn" id="logoutBtn" data-js="logoutBtn" type="button" style="background: none; border: none; font: inherit; cursor: pointer; color: var(--color-danger); font-weight: 700;">
                Keluar
            </button>
        </li>
        <li>
            <span class="nav-user-name" style="font-weight: 700; color: var(--color-primary-dark);">${user.name}</span>
        </li>
    ` : `
        <li>
            <button class="nav-link-btn" id="openAuthBtn" data-js="openAuthBtn" type="button" style="background: none; border: none; font: inherit; cursor: pointer; color: var(--color-primary); font-weight: 700;">
                Masuk / Daftar
            </button>
        </li>
    `;

    return `
    <nav class="navbar" aria-label="Navigasi utama">
        <div class="navbar-container">
            <a class="navbar-logo" href="#beranda" aria-label="Toko Sembako Diana">
                <img src="images/Icon.png" alt="" class="logo-mark" aria-hidden="true">
                <span>Toko Sembako Diana</span>
            </a>

            <ul class="nav-menu">
                <li><a href="#beranda" class="nav-link">Beranda</a></li>
                <li><a href="#produk" class="nav-link">Produk</a></li>
                <li><a href="#tentang" class="nav-link">Tentang</a></li>
                <li><a href="#kontak" class="nav-link">Kontak</a></li>
                ${adminLink}
                <li>
                    <button class="nav-link-btn" id="myOrdersBtn" data-js="myOrdersBtn" type="button" style="background: none; border: none; font: inherit; cursor: pointer; color: var(--color-ink);" ${!user ? "disabled" : ""}>
                        Pesanan Saya
                    </button>
                </li>
                ${authButtons}
                <li>
                    <button class="cart-btn" id="cartBtn" data-js="cartBtn" type="button" aria-label="Buka keranjang" ${!user ? 'disabled' : ''}>
                        <img src="images/Keranjang.png" alt="" class="cart-icon">
                        <span>Keranjang</span>
                        <span class="cart-badge is-empty" id="cartBadge" data-js="cartBadge">0</span>
                    </button>
                </li>
            </ul>
        </div>
    </nav>
    `;
}
