import { CartContents } from "@/components/cart/cart-contents";

export default function CartPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-headline mb-8">Shopping Cart</h1>
            <CartContents />
        </div>
    );
}
