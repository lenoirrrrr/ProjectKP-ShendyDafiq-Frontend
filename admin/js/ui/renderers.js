import { appConfig } from "../config.js";
import { createElement } from "../utils/dom.js";

function formatCurrency(value) {
    return new Intl.NumberFormat(appConfig.locale, {
        style: "currency",
        currency: appConfig.inventory.currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat(appConfig.locale).format(value);
}

function getStockStatus(product) {
    if (product.stock === 0) {
        return {
            className: "status-empty",
            label: "Habis",
        };
    }

    if (product.stock <= appConfig.inventory.lowStockThreshold) {
        return {
            className: "status-low",
            label: "Menipis",
        };
    }

    return {
        className: "status-ok",
        label: "Aman",
    };
}

export function renderStats(container, stats) {
    const cards = [
        {
            label: "Total Produk",
            value: formatNumber(stats.totalProducts),
            note: "SKU aktif di inventory",
        },
        {
            label: "Total Stok",
            value: formatNumber(stats.totalStock),
            note: "Jumlah unit tersedia",
        },
        {
            label: "Stok Menipis",
            value: formatNumber(stats.lowStockProducts),
            note: `Stok <= ${appConfig.inventory.lowStockThreshold}`,
        },
        {
            label: "Nilai Inventory",
            value: formatCurrency(stats.inventoryValue),
            note: `${formatNumber(stats.emptyStockProducts)} produk habis`,
        },
    ];

    const fragment = document.createDocumentFragment();
    cards.forEach((card) => {
        fragment.appendChild(
            createElement("article", { className: "stat-card" }, [
                createElement("span", { textContent: card.label }),
                createElement("strong", { textContent: card.value }),
                createElement("small", { textContent: card.note }),
            ])
        );
    });

    container.replaceChildren(fragment);
}

export function renderProductsTable(tableBody, emptyState, products) {
    tableBody.replaceChildren();
    emptyState.hidden = products.length > 0;

    if (products.length === 0) {
        return;
    }

    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
        const status = getStockStatus(product);
        let imageSrc = product.image || "../images/beras.jpg";
        
        if (imageSrc.startsWith("images/")) {
            imageSrc = "../" + imageSrc;
        }

        const row = createElement("tr", {}, [
            createElement("td", {}, [
                createElement("div", { className: "product-cell" }, [
                    createElement("img", {
                        className: "product-thumb",
                        attributes: {
                            src: imageSrc,
                            alt: product.name,
                            loading: "lazy",
                        },
                        events: {
                            error: (e) => {
                                e.target.src = "../images/beras.jpg";
                            }
                        }
                    }),
                    createElement("div", {}, [
                        createElement("strong", { textContent: product.name }),
                        createElement("span", { textContent: product.description || "Tidak ada deskripsi." }),
                    ]),
                ]),
            ]),
            createElement("td", { textContent: product.category }),
            createElement("td", { textContent: formatCurrency(product.price) }),
            createElement("td", {}, [
                createElement("span", {
                    className: `stock-badge ${status.className}`,
                    textContent: formatNumber(product.stock),
                }),
            ]),
            createElement("td", {}, [
                createElement("span", {
                    className: `status-badge ${status.className}`,
                    textContent: status.label,
                }),
            ]),
            createElement("td", {}, [
                createElement("div", { className: "row-actions" }, [
                    createElement("button", {
                        className: "action-btn",
                        textContent: "Edit",
                        attributes: { type: "button" },
                        dataset: { action: "edit", productId: product.id },
                    }),
                    createElement("button", {
                        className: "action-btn action-danger",
                        textContent: "Hapus",
                        attributes: { type: "button" },
                        dataset: { action: "delete", productId: product.id },
                    }),
                ]),
            ]),
        ]);

        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
}

export function renderOrdersTable(tableBody, emptyState, orders) {
    tableBody.replaceChildren();
    emptyState.hidden = orders.length > 0;

    if (orders.length === 0) return;

    const fragment = document.createDocumentFragment();
    orders.forEach((order) => {
        const orderStatus = order.status || order.Status || "PENDING";
        const orderId = order.id || order.ID || "";
        const orderDate = order.createdAt || order.created_at || order.CreatedAt || new Date().toISOString();
        const totalAmount = order.totalAmount || order.total_amount || order.TotalAmount || 0;
        const customerName = order.customerName || (order.order && order.order.customerName) || "Pembeli Umum";

        const row = createElement("tr", {}, [
            createElement("td", { 
                textContent: String(orderId).substring(0, 8),
                attributes: { style: "font-family: monospace; font-size: 13px; color: var(--color-body-muted);" }
            }),
            createElement("td", { 
                textContent: customerName,
                attributes: { style: "font-size: 14px; font-weight: 500;" }
            }),
            createElement("td", { 
                textContent: new Date(orderDate).toLocaleString(appConfig.locale),
                attributes: { style: "font-size: 14px;" }
            }),
            createElement("td", { 
                textContent: formatCurrency(totalAmount),
                attributes: { style: "font-weight: 600; font-size: 14px;" }
            }),
            createElement("td", {}, [
                createElement("select", {
                    className: "status-select",
                    dataset: { action: "updateStatus", orderId: orderId },
                    attributes: { style: "padding: 4px 8px; border-radius: 6px; border: 1px solid var(--color-line); font-size: 13px; background: #fff;" }
                }, [
                    createElement("option", { value: "PENDING", textContent: "PENDING", attributes: orderStatus === "PENDING" ? { selected: "" } : {} }),
                    createElement("option", { value: "PROCESSING", textContent: "PROCESSING", attributes: orderStatus === "PROCESSING" ? { selected: "" } : {} }),
                    createElement("option", { value: "COMPLETED", textContent: "COMPLETED", attributes: orderStatus === "COMPLETED" ? { selected: "" } : {} }),
                    createElement("option", { value: "CANCELLED", textContent: "CANCELLED", attributes: orderStatus === "CANCELLED" ? { selected: "" } : {} }),
                ]),
            ]),
            createElement("td", {}, [
                createElement("button", {
                    className: "action-btn",
                    textContent: "View Details",
                    attributes: { type: "button" },
                    dataset: { action: "viewItems", orderId: orderId },
                }),
            ]),
        ]);
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}

export function renderOrderItems(tableBody, items) {
    tableBody.replaceChildren();
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        const productName = item.product?.name || item.productId || item.product_id || "Produk tidak diketahui";
        const price = item.price || 0;
        const quantity = item.quantity || 0;

        const row = createElement("tr", {}, [
            createElement("td", {}, [
                createElement("div", { className: "product-cell" }, [
                    createElement("strong", { 
                        textContent: productName,
                        attributes: { style: "font-size: 14px;" }
                    }),
                ]),
            ]),
            createElement("td", { 
                textContent: formatCurrency(price),
                attributes: { style: "font-size: 14px;" }
            }),
            createElement("td", { 
                textContent: quantity,
                attributes: { style: "font-size: 14px;" }
            }),
            createElement("td", { 
                textContent: formatCurrency(price * quantity),
                attributes: { style: "font-weight: 600; font-size: 14px;" }
            }),
            createElement("td", {}, [
                createElement("button", {
                    className: "icon-btn delete-btn",
                    textContent: "×",
                    attributes: { 
                        type: "button", 
                        title: "Hapus item",
                        style: "color: #ff3b30; font-size: 20px; font-weight: bold; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: #fff1f0; border-radius: 50%;"
                    },
                    dataset: { action: "deleteItem", itemId: item.id },
                }),
            ]),
        ]);
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}
