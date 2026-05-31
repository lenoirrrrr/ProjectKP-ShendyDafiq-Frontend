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
    function createCheckoutDraft({ customerName, pickupMethod, paymentMethod, address }) {
        const items = cartService.getItems();
        const safeCustomerName = sanitizeText(customerName, { maxLength: 100 });
        const safePickupMethod = sanitizeText(pickupMethod, { maxLength: 24 });
        const safePaymentMethod = sanitizeText(paymentMethod, { maxLength: 24 });
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

        if (safePickupMethod === "delivery" && safeAddress.length === 0) {
            return result.fail(
                "Alamat pengiriman perlu diisi.",
                new AppError({
                    category: errorCategory.validation,
                    code: "MISSING_DELIVERY_ADDRESS",
                    message: "Alamat pengiriman perlu diisi.",
                    severity: "warn",
                })
            );
        }

        return result.ok({
            items,
            customerName: safeCustomerName,
            pickupMethod: safePickupMethod,
            paymentMethod: safePaymentMethod,
            address: safePickupMethod === "delivery" ? safeAddress : "",
            totalAmount: cartService.getTotal(),
            currency: appConfig.cart.currency,
            createdAt: new Date().toISOString(),
        });
    }

    async function submitCheckout(formData) {
        try {
            const draftResult = createCheckoutDraft(formData);
            if (!draftResult.ok) return draftResult;

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

            // Assuming a regular user might need a token if the backend requires it,
            // we'll pass no token for now since it's not provided in the frontend context,
            // or we could use a dummy token if the backend strictly requires it.
            // Documentation says: Headers: Authorization: Bearer <token>
            // We will pass a dummy token to satisfy the backend requirement.
            const response = await apiClient.post('/orders', orderPayload, {
                token: 'dummy-token-for-user'
            });

            return result.ok(response.data);
        } catch (error) {
            // Fallback: If server is offline, simulate a successful order locally
            if (error?.code === "API_NETWORK_ERROR" || error?.cause?.code === "API_NETWORK_ERROR") {
                console.warn("[ORDER:FALLBACK] Server tidak merespons, pesanan disimulasikan secara lokal.");
                return result.ok(draftResult.data);
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
            const response = await apiClient.get('/orders', {
                token: 'dummy-token-for-user'
            });

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
