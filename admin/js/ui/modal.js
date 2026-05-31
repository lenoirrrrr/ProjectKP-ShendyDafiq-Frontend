import { clearFormErrors, fillForm } from "../utils/dom.js";

const emptyProductForm = Object.freeze({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    image: "",
    description: "",
});

export function createModalController(elements) {
    let mode = "create";

    function isOpen() {
        return elements.productModal.classList.contains("active");
    }

    function openCreate() {
        mode = "create";
        elements.productModalTitle.textContent = "Tambah Produk";
        elements.productForm.reset();
        clearFormErrors(elements.productForm);
        fillForm(elements.productForm, emptyProductForm);
        open();
    }

    function openEdit(product) {
        mode = "edit";
        elements.productModalTitle.textContent = "Edit Produk";
        elements.productForm.reset();
        clearFormErrors(elements.productForm);
        fillForm(elements.productForm, product);
        open();
    }

    function open() {
        elements.productModal.hidden = false;
        elements.modalOverlay.hidden = false;
        elements.productModal.classList.add("active");
        elements.modalOverlay.classList.add("active");
        elements.productModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        elements.productForm.elements.namedItem("name")?.focus();
    }

    function close() {
        elements.productModal.classList.remove("active");
        elements.modalOverlay.classList.remove("active");
        elements.productModal.setAttribute("aria-hidden", "true");
        elements.productModal.hidden = true;
        elements.modalOverlay.hidden = true;
        document.body.classList.remove("modal-open");
    }

    function getMode() {
        return mode;
    }

    return { isOpen, openCreate, openEdit, close, getMode };
}
