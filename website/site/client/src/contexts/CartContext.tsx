/**
 * سلة الطلب المشتركة بين كل صفحات الموقع: تُحفظ في المتصفح وتنتقل إلى صفحة الدفع الموقّعة.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { canBuy, type CartItem, type Product } from "@/lib/siteData";

type CartContextValue = {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  itemCount: number;
  cartTotal: number;
  paying: boolean;
  addToCart: (product: Product) => void;
  changeQuantity: (id: number, direction: 1 | -1) => void;
  checkout: () => Promise<void>;
  orderByWhatsapp: (whatsappUrl: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ayqae-cart");
      // Keep only items that can be paid online (carts saved by the older WhatsApp-only version had no price).
      if (stored) setCart((JSON.parse(stored) as CartItem[]).filter(canBuy));
    } catch {
      localStorage.removeItem("ayqae-cart");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ayqae-cart", JSON.stringify(cart));
    } catch {
      /* storage unavailable */
    }
  }, [cart]);

  // Back from pay.ayqaealhayaa.sa after a successful payment: empty the cart and say thanks.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (!paid) return;
    setCart([]);
    toast.success(`تم الدفع بنجاح. رقم طلبك ${paid.replace(/[^A-Z0-9-]/gi, "")}`);
    params.delete("paid");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  // A page restored with the Back button from the pay site must not stay in the "redirecting" state.
  useEffect(() => {
    const reset = () => setPaying(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.priceHalalas ?? 0) * item.quantity, 0), [cart]);

  const addToCart = useCallback((product: Product) => {
    if (!canBuy(product)) {
      toast.info("هذا العنصر يُسعّر حسب الطلب، تواصل معنا للحصول على عرض.");
      return;
    }
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...current, { ...product, quantity: 1 }];
    });
    toast.success("أُضيف المنتج إلى السلة");
  }, []);

  const changeQuantity = useCallback((id: number, direction: 1 | -1) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + direction } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  // Online payment: the server prices and signs the cart, then the browser posts it to pay.ayqaealhayaa.sa.
  const checkout = useCallback(async () => {
    if (!cart.length) {
      toast.error("أضف منتجًا واحدًا على الأقل قبل إتمام الطلب");
      return;
    }
    setPaying(true);
    try {
      const response = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((item) => ({ id: item.id, quantity: item.quantity })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.action) throw new Error(data.error || "تعذر الانتقال إلى صفحة الدفع، حاول مرة أخرى.");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      for (const [key, value] of Object.entries(data.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setPaying(false);
      toast.error(error instanceof Error ? error.message : "تعذر الانتقال إلى صفحة الدفع");
    }
  }, [cart]);

  const orderByWhatsapp = useCallback(
    (whatsappUrl: string) => {
      const lines = cart.map((item) => `• ${item.name} × ${item.quantity}`).join("\n");
      window.open(`${whatsappUrl}?text=${encodeURIComponent(`مرحبًا، أرغب في طلب المنتجات التالية:\n${lines}`)}`, "_blank", "noopener,noreferrer");
    },
    [cart],
  );

  const value: CartContextValue = { cart, cartOpen, setCartOpen, itemCount, cartTotal, paying, addToCart, changeQuantity, checkout, orderByWhatsapp };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
