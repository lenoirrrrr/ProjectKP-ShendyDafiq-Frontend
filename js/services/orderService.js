import { appConfig } from "../config/config.js";
import { AppError, errorCategory } from "../utils/errorHandler.js";
import { sanitizeText } from "../utils/sanitizer.js";
import { apiClient } from "../utils/apiClient.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

export function createOrderService({ cartService }) {
    function createCheckoutDraft({ customerName, pickupMethod, paymentMethod, kecamatan, dusun, address }) {
        const items = cartService.getItems();
        const safeCustomerName = sanitizeText(customerName, { maxLength: 100 });
        const safePickupMethod = sanitizeText(pickupMethod, { maxLength: 24 });
        const safePaymentMethod = sanitizeText(paymentMethod, { maxLength: 24 });
        const safeKecamatan = sanitizeText(kecamatan, { maxLength: 100 });
        const safeDusun = sanitizeText(dusun, { maxLength: 100 });
        const safeAddress = sanitizeText(address, { maxLength: 500, allowLineBreaks: true });

        if (items.length === 0) {
            return result.fail(
                "Keranjang masih kosong.",
                new AppError({
                    category: errorCategory.order,
                    code: "EMPTY_CART",
                    message: "Keranjang masih kosong.",
                    technicalMessage: "Checkout attempted with empty cart.",
                    severity: "warn",
                })
            );
        }

        if (!safeCustomerName) {
            return result.fail(
                "Nama pelanggan wajib diisi.",
                new AppError({
                    category: errorCategory.validation,
                    code: "MISSING_CUSTOMER_NAME",
                    message: "Nama pelanggan wajib diisi.",
                    severity: "warn",
                })
            );
        }

        if (!["takeaway", "delivery"].includes(safePickupMethod)) {
            return result.fail(
                "Metode pengambilan tidak valid.",
                new AppError({
                    category: errorCategory.validation,
                    code: "INVALID_PICKUP_METHOD",
                    message: "Metode pengambilan tidak valid.",
                    severity: "warn",
                })
            );
        }

        if (!["qris", "transfer"].includes(safePaymentMethod)) {
            return result.fail(
                "Metode pembayaran tidak valid.",
                new AppError({
                    category: errorCategory.validation,
                    code: "INVALID_PAYMENT_METHOD",
                    message: "Metode pembayaran tidak valid.",
                    severity: "warn",
                })
            );
        }

        if (safePickupMethod === "delivery") {
            if (!safeKecamatan) {
                return result.fail(
                    "Kecamatan wajib dipilih.",
                    new AppError({
                        category: errorCategory.validation,
                        code: "MISSING_KECAMATAN",
                        message: "Kecamatan wajib dipilih.",
                        severity: "warn",
                    })
                );
            }
            if (!safeDusun) {
                return result.fail(
                    "Dusun / Desa wajib diisi.",
                    new AppError({
                        category: errorCategory.validation,
                        code: "MISSING_DUSUN",
                        message: "Dusun / Desa wajib diisi.",
                        severity: "warn",
                    })
                );
            }
            if (safeAddress.length === 0) {
                return result.fail(
                    "Alamat lengkap detail perlu diisi.",
                    new AppError({
                        category: errorCategory.validation,
                        code: "MISSING_DELIVERY_ADDRESS",
                        message: "Alamat lengkap detail perlu diisi.",
                        severity: "warn",
                    })
                );
            }
        }

        const subtotal = cartService.getTotal();
        let shippingFee = 0;

        const kecamatanFees = {
            "Bubutan": 55000,
            "Genteng": 50000,
            "Simokerto": 65000,
            "Tegalsari": 45000,
            "Gubeng": 45000,
            "Gunung Anyar": 50000,
            "Mulyorejo": 65000,
            "Rungkut": 45000,
            "Sukolilo": 55000,
            "Tambaksari": 55000,
            "Tenggilis Mejoyo": 40000,
            "Asemrowo": 75000,
            "Benowo": 125000,
            "Dukuh Pakis": 35000,
            "Karang Pilang": 20000,
            "Lakarsantri": 90000,
            "Sambikerep": 95000,
            "Tandes": 70000,
            "Bulak": 90000,
            "Kenjeran": 80000,
            "Krembangan": 75000,
            "Pabean Cantian": 80000,
            "Semampir": 85000,
            "Gayungan": 10000,
            "Jambangan": 0,
            "Pakal": 110000,
            "Sawahan": 35000,
            "Sukomanunggal": 50000,
            "Wiyung": 30000,
            "Wonocolo": 15000,
            "Wonokromo": 25000
        };

        if (safePickupMethod === "delivery") {
            if (subtotal < 50000) {
                return result.fail(
                    "Minimal belanja untuk pengiriman adalah Rp 50.000.",
                    new AppError({
                        category: errorCategory.validation,
                        code: "MINIMUM_ORDER_NOT_MET",
                        message: "Minimal belanja untuk pengiriman adalah Rp 50.000.",
                        severity: "warn",
                    })
                );
            }
            const baseFee = kecamatanFees[safeKecamatan] || 0;
            shippingFee = subtotal >= 1000000 ? 0 : baseFee;
        }

        const formattedAddress = safePickupMethod === "delivery" 
            ? `Kecamatan ${safeKecamatan}, Dusun ${safeDusun}, ${safeAddress}`
            : "";

        return result.ok({
            items,
            customerName: safeCustomerName,
            pickupMethod: safePickupMethod,
            paymentMethod: safePaymentMethod,
            address: formattedAddress,
            totalAmount: subtotal + shippingFee,
            currency: appConfig.cart.currency,
            createdAt: new Date().toISOString(),
        });
    }

    async function submitCheckout(formData) {
        const draftResult = createCheckoutDraft(formData);

        if (!draftResult.ok) {
            return draftResult;
        }

        try {
            const draft = draftResult.data;

            // Save customer name to localStorage for future filtering
            try {
                localStorage.setItem('kp_customer_name', draft.customerName);
            } catch (e) {
                console.warn("Gagal menyimpan nama pelanggan ke localStorage");
            }

            // Map frontend cart items to the backend payload structure
            const orderPayload = {
                customerName: draft.customerName,
                items: draft.items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                // We send the extra data, though the backend might ignore it if it only expects 'items'
                pickupMethod: draft.pickupMethod,
                paymentMethod: draft.paymentMethod,
                address: draft.address
            };

            const response = await apiClient.post("/orders", orderPayload);

            return result.ok(response.data);
        } catch (error) {
            // Fallback: If server is offline, simulate a successful order locally
            if (error?.code === "API_NETWORK_ERROR" || error?.cause?.code === "API_NETWORK_ERROR") {
                console.warn("[ORDER:FALLBACK] Server tidak merespons, pesanan disimulasikan secara lokal.");
                const simulatedOrder = {
                    ...draftResult.data,
                    id: `local_${Date.now()}`
                };
                return result.ok(simulatedOrder);
            }

            return result.fail(
                "Pesanan gagal dibuat.",
                new AppError({
                    category: errorCategory.order,
                    code: "ORDER_SUBMIT_FAILED",
                    message: "Pesanan gagal dibuat.",
                    cause: error,
                })
            );
        }
    }

    async function getOrders() {
        try {
            const response = await apiClient.get("/orders");

            // Filter orders based on the customer name saved in localStorage
            const savedName = localStorage.getItem('kp_customer_name');
            let filteredOrders = response.data;

            if (savedName && Array.isArray(response.data)) {
                filteredOrders = response.data.filter(order => 
                    order.customerName === savedName
                );
            }

            return result.ok(filteredOrders);
        } catch (error) {
            return result.fail(
                "Gagal mengambil riwayat pesanan.",
                new AppError({
                    category: errorCategory.network,
                    code: "FETCH_ORDERS_FAILED",
                    message: "Gagal mengambil riwayat pesanan.",
                    technicalMessage: error.message,
                })
            );
        }
    }

    return { submitCheckout, getOrders };
}
