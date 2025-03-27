"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { InputField } from "@/components/InputField";
import Link from "next/link";
import { IoMdArrowDropright } from "react-icons/io";
import { useNotification } from "@/apiServices/NotificationService";
import { useRouter } from "next/navigation";

export default function Page() {
  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [totalAmount, setTotalAmount] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [colorId, setColorId] = useState();
  const [sizeId, setSizeId] = useState();
  const [quantity, setQuantity] = useState(1);
  const notify = useNotification();
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // Calculate discount amount based on percentage
  const calculateDiscount = (originalPrice, discountPercentage) => {
    const numValue = Number.parseFloat(
      typeof originalPrice === "string"
        ? originalPrice.toString().replace(/\./g, "").replace("đ", "").trim()
        : originalPrice
    );
    const numPercentage = Number.parseFloat(discountPercentage);

    if (isNaN(numValue) || isNaN(numPercentage)) return 0;

    return Math.round((numValue * numPercentage) / 100);
  };

  // Apply discount to calculate final price
  const applyDiscount = (originalPrice, discountAmount) => {
    const numValue = Number.parseFloat(
      typeof originalPrice === "string"
        ? originalPrice.toString().replace(/\./g, "").replace("đ", "").trim()
        : originalPrice
    );

    if (isNaN(numValue) || isNaN(discountAmount)) return numValue;

    return Math.max(0, numValue - discountAmount);
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const storedItem = sessionStorage.getItem("buy_now_product");
    const storedColorId = sessionStorage.getItem("buy_now_product_colorId");
    const storedSizeId = sessionStorage.getItem("buy_now_product_sizeId");
    const quantity = sessionStorage.getItem("buy_now_product_quantity");

    if (storedUser && storedItem) {
      const parsedItem = JSON.parse(storedItem);
      setItems(Array.isArray(parsedItem) ? parsedItem : [parsedItem]);
      setColorId(JSON.parse(storedColorId));
      setSizeId(JSON.parse(storedSizeId));
      setQuantity(Number.parseInt(quantity) || 1);
      setUser(JSON.parse(storedUser));

      // Set discount from product if available
      const discountPercentage = Array.isArray(parsedItem)
        ? parsedItem[0]?.discounts?.[0]?.percentage || 0
        : parsedItem?.discounts?.[0]?.percentage || 0;

      setDiscount(discountPercentage);

      // Calculate original amount
      let originalTotal = 0;
      if (Array.isArray(parsedItem)) {
        originalTotal = parsedItem.reduce(
          (sum, item) => sum + item.price * (item.quantity || 1),
          0
        );
      } else {
        originalTotal = parsedItem.price * (Number.parseInt(quantity) || 1);
      }

      setOriginalAmount(originalTotal);

      // Calculate discount amount
      const discountAmt = calculateDiscount(originalTotal, discountPercentage);
      setDiscountAmount(discountAmt);

      // Calculate final total after discount
      const finalTotal = applyDiscount(originalTotal, discountAmt);
      setTotalAmount(finalTotal);

      // Store the calculated values in session storage for persistence
      sessionStorage.setItem("discount", discountPercentage.toString());
      sessionStorage.setItem("discountAmount", discountAmt.toString());
      sessionStorage.setItem("total", finalTotal.toString());
    }
  }, []);

  const validateUserInfo = () => {
    if (!user?.phone) {
      notify(
        "Missing Information",
        "Please enter your phone number before confirming your order.",
        "topRight",
        "error"
      );
      return false;
    }
    if (!user?.address) {
      notify(
        "Missing Information",
        "Please enter your address before confirming your order.",
        "topRight",
        "error"
      );
      return false;
    }
    if (!user?.email) {
      notify(
        "Missing Information",
        "Please enter your email before confirming your order.",
        "topRight",
        "error"
      );
      return false;
    }
    return true;
  };

  async function createVNPayPayment() {
    setIsPending(true);
    try {
      const tempOrderId = `TEMP_${user?.id}_${Date.now()}`;
      const amountVND = Math.round(totalAmount * 1000);

      if (amountVND < 1000 || amountVND > 50000000) {
        notify(
          "Payment Error",
          "Amount must be from 1,000 to 50,000,000 VND",
          "topRight",
          "error"
        );
        setIsPending(false);
        return false;
      }

      // Prepare order items for storage
      const orderItems = items.map((item) => ({
        quantity: quantity || 1,
        total_price: (totalAmount / items.length) * (quantity || 1), // Distribute discounted price proportionally
        original_price: item.price * (quantity || 1),
        discount_amount: (discountAmount / items.length) * (quantity || 1), // Distribute discount proportionally
        product_color_id: colorId,
        product_size_id: sizeId,
        product_id: item.id,
      }));

      // Store complete order data
      sessionStorage.setItem(
        "pendingOrderData",
        JSON.stringify({
          userId: user?.id,
          totalAmount,
          originalAmount,
          discountAmount,
          discountPercentage: discount,
          paymentMethod: "vnpay",
          orderItems,
          tempOrderId,
          timestamp: Date.now(),
        })
      );

      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountVND,
          ipAddr: "13.160.92.202",
          txnRef: tempOrderId,
          orderInfo: tempOrderId,
          returnUrl: `${window.location.origin}/profile`,
        }),
      });

      const data = await response.json();

      if (!data?.paymentUrl) {
        throw new Error("Failed to generate payment URL");
      }

      window.location.href = data.paymentUrl;
      return true;
    } catch (error) {
      console.error("VNPAY payment error:", error);
      notify(
        "Payment Error",
        error.message || "Failed to process payment",
        "topRight",
        "error"
      );
      setIsPending(false);
      return false;
    }
  }

  const handleMomoPayment = async () => {
    setIsPending(true);
    const amountVND = Math.round(totalAmount * 1000);

    if (amountVND < 1000 || amountVND > 50000000) {
      notify(
        "Payment Error",
        "Amount must be from 1,000 to 50,000,000 VND",
        "topRight",
        "error"
      );
      setIsPending(false);
      return false;
    }

    try {
      const tempOrderId = `TEMP_${user.id}_${Date.now()}`;
      const orderItems = items.map((item) => ({
        quantity: quantity || 1,
        total_price: (totalAmount / items.length) * (quantity || 1), // Distribute discounted price proportionally
        original_price: item.price * (quantity || 1),
        discount_amount: (discountAmount / items.length) * (quantity || 1), // Distribute discount proportionally
        product_color_id: colorId,
        product_size_id: sizeId,
        product_id: item.id,
      }));

      const response = await fetch(`${API_BASE_URL}/api/momo/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          amount: amountVND,
          orderId: tempOrderId,
          extraData: JSON.stringify({
            userId: user?.id,
            totalAmount,
            originalAmount,
            discountAmount,
            discountPercentage: discount,
            paymentMethod: "momo",
            orderItems,
          }),
        }),
      });

      const data = await response.json();

      if (data.payUrl) {
        sessionStorage.setItem(
          "pendingOrderData",
          JSON.stringify({
            userId: user.id,
            totalAmount,
            originalAmount,
            discountAmount,
            discountPercentage: discount,
            paymentMethod: "momo",
            orderItems,
            tempOrderId,
            timestamp: Date.now(),
          })
        );
        window.location.href = data.payUrl;
        return true;
      } else {
        throw new Error("Unable to generate payment link");
      }
    } catch (error) {
      console.error("Payment error:", error);
      notify(
        "Payment Error",
        error.message || "Something went wrong",
        "topRight",
        "error"
      );
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const createOrder = async () => {
    try {
      const orderItems = items.map((item) => ({
        quantity: quantity || 1,
        total_price: (totalAmount / items.length) * (quantity || 1), // Distribute discounted price proportionally
        original_price: item.price * (quantity || 1),
        discount_amount: (discountAmount / items.length) * (quantity || 1), // Distribute discount proportionally
        product_color_id: colorId,
        product_size_id: sizeId,
        product_id: item.id,
      }));

      const payload = {
        user_id: user.id,
        total_amount: totalAmount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        discount_percentage: discount,
        payment_method: paymentMethod,
        order_items: orderItems,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/buyer/order/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || "Failed to create order");
      }

      notify(
        "Order Created",
        "Your order has been created successfully.",
        "topRight",
        "success"
      );

      router.push("/profile");

      sessionStorage.removeItem("buy_now_product");
      sessionStorage.removeItem("buy_now_product_colorId");
      sessionStorage.removeItem("buy_now_product_sizeId");
      sessionStorage.removeItem("buy_now_product_quantity");
      sessionStorage.removeItem("discount");
      sessionStorage.removeItem("discountAmount");
      sessionStorage.removeItem("total");

      return true;
    } catch (error) {
      console.error("Failed to create order:", error);
      notify(
        "Order Creation Failed",
        error.message || "There was a problem creating your order.",
        "topRight",
        "error"
      );
      return false;
    }
  };

  const handleCreateOrders = async () => {
    if (!totalAmount || isNaN(totalAmount)) {
      notify(
        "Invalid Order",
        "Please go back to your cart and try again!",
        "topRight",
        "warning"
      );
      return;
    }

    if (!validateUserInfo()) {
      return;
    }

    if (!items.length || !colorId || !sizeId || !quantity) {
      notify(
        "Invalid Order",
        "Missing product information.",
        "topRight",
        "warning"
      );
      return;
    }

    setIsPending(true);

    try {
      if (paymentMethod === "momo") {
        await handleMomoPayment();
      } else if (paymentMethod === "vnpay") {
        await createVNPayPayment();
      } else {
        await createOrder();
      }
    } catch (error) {
      console.error("Order process failed:", error);
      notify(
        "Process Failed",
        "There was a problem processing your order.",
        "topRight",
        "error"
      );
    } finally {
      setIsPending(false);
    }
  };

  // Function to update discount manually
  const updateDiscount = (newDiscountPercentage) => {
    const numPercentage = Number.parseFloat(newDiscountPercentage);
    if (isNaN(numPercentage)) return;

    setDiscount(numPercentage);

    // Recalculate discount amount
    const newDiscountAmount = calculateDiscount(originalAmount, numPercentage);
    setDiscountAmount(newDiscountAmount);

    // Recalculate total amount
    const newTotalAmount = applyDiscount(originalAmount, newDiscountAmount);
    setTotalAmount(newTotalAmount);

    // Update session storage
    sessionStorage.setItem("discount", numPercentage.toString());
    sessionStorage.setItem("discountAmount", newDiscountAmount.toString());
    sessionStorage.setItem("total", newTotalAmount.toString());
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <nav className="text-sm mb-4 flex gap-2 text-end">
          <Link className="text-gray-500 hover:text-gray-700" href="/products">
            Products
          </Link>{" "}
          <IoMdArrowDropright className="pt-1 h-full" />
          <Link className="text-gray-500 hover:text-gray-700" href="/order">
            Order
          </Link>{" "}
        </nav>
        <h1 className="text-3xl font-bold mb-6">Confirm your order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg">CONTACT INFO</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-red-500 hover:underline"
                >
                  {isEditing ? "Cancel" : "Update"}
                </button>
              </div>
              {isEditing ? (
                <form className="space-y-4">
                  <InputField
                    label="Phone Number"
                    type="text"
                    value={user?.phone || ""}
                    onChange={(e) =>
                      setUser({ ...user, phone: e.target.value })
                    }
                  />
                  <InputField
                    label="Email Address"
                    type="email"
                    value={user?.email || ""}
                    onChange={(e) =>
                      setUser({ ...user, email: e.target.value })
                    }
                  />
                  <InputField
                    label="Address Line 1"
                    type="text"
                    value={user?.address || ""}
                    onChange={(e) =>
                      setUser({ ...user, address: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <InputField
                    label="Phone Number"
                    type="text"
                    value={user?.phone || ""}
                    disabled
                  />
                  <InputField
                    label="Email Address"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <InputField
                    label="Address"
                    type="text"
                    value={user?.address || ""}
                    disabled
                  />
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg mb-4">PAYMENT</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Method
                </label>
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm h-12"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cod">Cash on delivery</option>
                  <option value="momo">Momo</option>
                  <option value="vnpay">VNpay</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg mx-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Order Summary
              </h2>
              <div className="space-y-6 divide-y divide-gray-200">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between pt-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Image
                          alt={item.name || "Product"}
                          className="w-16 h-16 rounded-lg object-cover"
                          height={64}
                          src={item.main_image || "https://placehold.co/64x64"}
                          width={64}
                        />
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {item.name || "Product"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Size:{" "}
                            {item.sizes?.find((size) => size.id === sizeId)
                              ?.name || "N/A"}
                            , Color:{" "}
                            {item.colors?.find((color) => color.id === colorId)
                              ?.name || "N/A"}
                          </p>
                          <p className="text-sm font-semibold text-gray-700 mt-1">
                            {item.price || 0}đ
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700 font-semibold">
                          Qty: {quantity || 1}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No items in your order
                  </div>
                )}
              </div>
              <hr className="mt-7"></hr>
              <div>
                <div className="flex justify-between mb-1 mt-8">
                  <span>Original Total</span>
                  <span className="text-gray-700">
                    {(originalAmount * 1000 || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Discount ({discount}%)</span>
                  <span className="text-red-500">
                    -{(discountAmount * 1000 || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg mb-2">
                  <span>Final Total</span>
                  <span>
                    {(totalAmount * 1000 || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl mt-6 text-lg font-medium transition-all disabled:bg-gray-400"
                onClick={handleCreateOrders}
                disabled={isPending}
              >
                {isPending
                  ? "Processing..."
                  : paymentMethod === "momo" || paymentMethod === "vnpay"
                  ? "Proceed to Payment"
                  : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
