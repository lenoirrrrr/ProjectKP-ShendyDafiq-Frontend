import { getCheckedRadioValue } from "../utils/dom.js";

export function createModalController({ elements }) {
    function isOpen() {
        return elements.checkoutModal.classList.contains("active");
    }

    function open() {
        elements.checkoutModal.hidden = false;
        elements.modalOverlay.hidden = false;
        elements.checkoutModal.classList.add("active");
        elements.modalOverlay.classList.add("active");
        elements.checkoutModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        elements.modalCloseBtn.focus();
    }

    function close() {
        elements.checkoutModal.classList.remove("active");
        elements.userOrderModal.classList.remove("active");
        elements.modalOverlay.classList.remove("active");
        elements.checkoutModal.setAttribute("aria-hidden", "true");
        elements.userOrderModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        elements.checkoutModal.hidden = true;
        elements.userOrderModal.hidden = true;
        elements.modalOverlay.hidden = true;
    }

    function openUserOrders() {
        elements.userOrderModal.hidden = false;
        elements.modalOverlay.hidden = false;
        elements.userOrderModal.classList.add("active");
        elements.modalOverlay.classList.add("active");
        elements.userOrderModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function updateDeliveryOptions() {
        const pickupMethod = getCheckedRadioValue(elements.pickupInputs, "takeaway");
        const isDelivery = pickupMethod === "delivery";
        elements.deliveryAddressSection.hidden = !isDelivery;

        if (!isDelivery) {
            elements.deliveryAddress.value = "";
        }
    }

    function getCheckoutFormData() {
        return {
            customerName: elements.customerName.value,
            pickupMethod: getCheckedRadioValue(elements.pickupInputs, "takeaway"),
            paymentMethod: getCheckedRadioValue(elements.paymentInputs, "qris"),
            address: elements.deliveryAddress.value,
        };
    }

    return { isOpen, open, close, updateDeliveryOptions, getCheckoutFormData, openUserOrders };
}
