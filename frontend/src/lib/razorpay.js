const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** Load Razorpay Checkout once. Resolves to the global Razorpay constructor. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay failed to load.")));
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

/**
 * Open Razorpay Checkout for an order created by the backend.
 * Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature } on success,
 * rejects with an Error if the student closes the window or payment fails.
 */
export async function payWithRazorpay({ order, title, user }) {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: "LearnHub",
      description: title,
      prefill: { name: user.full_name, email: user.email, contact: user.phone || undefined },
      theme: { color: "#6c3ce9" },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
    });
    rzp.on?.("payment.failed", (r) => reject(new Error(r?.error?.description || "Payment failed.")));
    rzp.open();
  });
}
