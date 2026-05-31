import { appConfig } from "../config/config.js";
import { createElement } from "../utils/dom.js";

export function createProductRenderer() {
    function formatCurrency(value) {
        return new Intl.NumberFormat(appConfig.locale, {
            style: "currency",
            currency: appConfig.cart.currency,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function renderState(container, message, type = "info") {
        container.replaceChildren(
            createElement("p", {
                className: `state-message state-${type}`,
                textContent: message,
            })
        );
    }

    function createProductCard(product) {
        let imageSrc = product.image || "images/default-product.jpg";
        
        if (imageSrc && imageSrc.startsWith("../")) {
            imageSrc = imageSrc.replace("../", "");
        }

        const productImage = createElement("div", { className: "product-image" }, [
            createElement("img", {
                attributes: {
                    src: imageSrc,
                    alt: product.imageAlt || product.name,
                    loading: "lazy",
                    decoding: "async",
                },
                events: {
                    error: (e) => {
                        e.target.src = "images/default-product.jpg";
                    }
                }
            }),
        ]);

        const isOutOfStock = product.stock === 0;
        const isLowStock = product.stock > 0 && product.stock <= 10;
        
        let stockBadgeText = `Stok: ${product.stock}`;
        let stockClass = "stock-status-ok";
        if (isOutOfStock) {
            stockBadgeText = "Stok Habis";
            stockClass = "stock-status-empty";
        } else if (isLowStock) {
            stockBadgeText = `Stok Menipis (${product.stock})`;
            stockClass = "stock-status-low";
        }

        const stockBadge = createElement("span", {
            className: `product-stock-badge ${stockClass}`,
            textContent: stockBadgeText
        });

        const productInfo = createElement("div", { className: "product-info" }, [
            createElement("div", { className: "product-meta-row" }, [
                createElement("span", { className: "product-tag", textContent: product.category }),
                stockBadge
            ]),
            createElement("h3", { className: "product-name", textContent: product.name }),
            createElement("p", { className: "product-price", textContent: formatCurrency(product.price) }),
            createElement("button", {
                className: `btn btn-order ${isOutOfStock ? "disabled" : ""}`,
                textContent: isOutOfStock ? "Habis" : "Pesan",
                attributes: { 
                    type: "button",
                    ...(isOutOfStock ? { disabled: "true" } : {})
                },
                dataset: {
                    action: "add-to-cart",
                    productId: product.id,
                },
            }),
        ]);

        return createElement("article", { className: "product-card" }, [productImage, productInfo]);
    }

    function renderProducts(container, products) {
        if (!Array.isArray(products) || products.length === 0) {
            renderState(container, "Produk belum tersedia.", "warning");
            return;
        }

        const fragment = document.createDocumentFragment();
        products.forEach((product) => {
            fragment.appendChild(createProductCard(product));
        });

        container.replaceChildren(fragment);
    }

    return {
        renderProducts,
        renderLoading(container) {
            renderState(container, "Memuat produk...", "info");
        },
        renderError(container, message = "Produk gagal dimuat.") {
            renderState(container, message, "error");
        },
    };
}

export function createCartRenderer({ elements }) {
    function formatCurrency(value) {
        return new Intl.NumberFormat(appConfig.locale, {
            style: "currency",
            currency: appConfig.cart.currency,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function updateCartBadge(count) {
        const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
        elements.cartBadge.textContent = safeCount;
        elements.cartBadge.classList.toggle("is-empty", safeCount === 0);
        elements.cartBtn.setAttribute("aria-label", `Buka keranjang, ${safeCount} item`);
    }

    function renderCartItems(items) {
        elements.cartItems.replaceChildren();

        if (!Array.isArray(items) || items.length === 0) {
            elements.cartItems.appendChild(
                createElement("p", {
                    className: "cart-empty",
                    textContent: "Keranjang kosong.",
                })
            );
            return;
        }

        items.forEach((item) => {
            const itemImage = createElement("img", {
                className: "cart-item-image",
                attributes: {
                    src: item.image,
                    alt: item.name,
                    loading: "lazy",
                },
            });

            const itemInfo = createElement("div", {}, [
                createElement("p", { className: "cart-item-name", textContent: item.name }),
                createElement("p", {
                    className: "cart-item-price",
                    textContent: `${formatCurrency(item.price)} x ${item.quantity}`,
                }),
            ]);

            const cartActions = createElement("div", { className: "cart-actions" }, [
                createElement("button", {
                    className: "qty-btn",
                    textContent: "-",
                    attributes: { type: "button", "aria-label": `Kurangi ${item.name}` },
                    dataset: { action: "decrease", itemId: item.id },
                }),
                createElement("span", { className: "cart-qty", textContent: item.quantity }),
                createElement("button", {
                    className: "qty-btn",
                    textContent: "+",
                    attributes: { type: "button", "aria-label": `Tambah ${item.name}` },
                    dataset: { action: "increase", itemId: item.id },
                }),
                createElement("button", {
                    className: "remove-btn",
                    textContent: "x",
                    attributes: { type: "button", "aria-label": `Hapus ${item.name}` },
                    dataset: { action: "remove", itemId: item.id },
                }),
            ]);

            elements.cartItems.appendChild(
                createElement("div", { className: "cart-item" }, [itemImage, itemInfo, cartActions])
            );
        });
    }

    function renderSummary(cartService) {
        renderCartItems(cartService.getItems());
        elements.totalPrice.textContent = formatCurrency(cartService.getTotal());
        updateCartBadge(cartService.getItemCount());
    }

    return { updateCartBadge, renderCartItems, renderSummary };
}

export function createUserOrderRenderer({ elements }) {
    function formatCurrency(value) {
        return new Intl.NumberFormat(appConfig.locale, {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(value);
    }

    function renderOrders(orders) {
        elements.userOrderList.replaceChildren();

        if (!Array.isArray(orders) || orders.length === 0) {
            elements.userOrderList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #666;">Belum ada riwayat pesanan.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleString('id-ID');
            const status = order.status || 'PENDING';
            
            const card = document.createElement('div');
            card.className = 'order-history-card';
            card.style.cssText = 'border: 1px solid #e1e1e1; border-radius: 14px; padding: 16px; margin-bottom: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 600; font-size: 15px; color: #1d1d1f;">Pesanan #${order.id.slice(0, 8)}</div>
                        <div style="font-size: 13px; color: #86868b; margin-top: 2px;">${date}</div>
                    </div>
                    <span style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; 
                        background: ${status === 'COMPLETED' ? '#e8f5e9' : '#fff3e0'}; 
                        color: ${status === 'COMPLETED' ? '#2e7d32' : '#ef6c00'};">
                        ${status}
                    </span>
                </div>
                <div style="border-top: 1px solid #f5f5f7; margin: 10px 0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; color: #1d1d1f;">Total Pembayaran</span>
                    <span style="font-weight: 600; color: #1d1d1f; font-size: 16px;">${formatCurrency(order.totalAmount)}</span>
                </div>
            `;
            fragment.appendChild(card);
        });
        elements.userOrderList.appendChild(fragment);
    }

    return { renderOrders };
}
