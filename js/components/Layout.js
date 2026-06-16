import { Navbar } from "./Navbar.js";
import { Hero } from "./Hero.js";
import { ProductSection } from "./ProductSection.js";
import { About } from "./About.js";
import { Contact } from "./Contact.js";
import { Footer } from "./Footer.js";
import { CheckoutModal } from "./CheckoutModal.js";
import { UserOrderModal } from "./UserOrderModal.js";
import { AuthModal } from "./AuthModal.js";
import { Toast } from "./Toast.js";

export function Layout(user = null) {
    return `
        ${Navbar(user)}
        <main>
            ${Hero()}
            ${ProductSection()}
            ${About()}
            ${Contact()}
        </main>
        ${Footer()}
        ${CheckoutModal()}
        ${UserOrderModal()}
        ${AuthModal()}
        ${Toast()}
    `;
}
