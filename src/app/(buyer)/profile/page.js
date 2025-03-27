"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Menu } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { getUserOrders } from "@/apiServices/orders/page";
import { getUserWishlists } from "@/apiServices/wishlists/page";
import { useNotification } from "@/apiServices/NotificationService";
import { useRouter, useSearchParams } from "next/navigation";
import OrdersList from "@/components/OrdersList";
import UserProfile from "@/components/UserProfile";
import WishlistItems from "@/components/WishlistItem";
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [selectedTab, setSelectedTab] = useState(tabParam || "orders");
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const notify = useNotification();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [colorId, setColorId] = useState();
  const [sizeId, setSizeId] = useState();
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Use a ref to track if payment has been processed
  const paymentProcessedRef = useRef(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

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

      if (Array.isArray(parsedItem)) {
        const total = parsedItem.reduce(
          (sum, item) => sum + item.price * (item.quantity || 1),
          0
        );
        setTotalAmount(total);
      } else {
        setTotalAmount(parsedItem.price * (Number.parseInt(quantity) || 1));
      }
    }
  }, []);

  // Handle VNPAY callback
  useEffect(() => {
    const handlePaymentCallback = async () => {
      // Check if payment has already been processed in this session
      if (paymentProcessedRef.current || processingPayment) return;

      const resultCode = searchParams.get("resultCode");
      const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
      const vnp_TransactionStatus = searchParams.get("vnp_TransactionStatus");
      const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
      const buy_now_product = sessionStorage.getItem("buy_now_product");

      // Check if we have any payment callback parameters
      if (!resultCode && !vnp_ResponseCode && !vnp_TransactionStatus) {
        return;
      }

      // Set the ref to true to prevent duplicate processing
      paymentProcessedRef.current = true;
      setProcessingPayment(true);

      // Get the transaction ID from URL or session storage
      const vnp_TxnRef = searchParams.get("vnp_TxnRef");
      const pendingOrderData = sessionStorage.getItem("pendingOrderData");
      let orderData = null;

      if (pendingOrderData) {
        try {
          orderData = JSON.parse(pendingOrderData);
        } catch (error) {
          console.error("Error parsing pending order data:", error);
        }
      }

      // Check if this transaction was already processed
      const processedKey = `processed_${
        vnp_TxnRef || orderData?.tempOrderId || ""
      }`;
      if (sessionStorage.getItem(processedKey)) {
        console.log("Transaction already processed:", processedKey);
        // Clear URL parameters without refreshing
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, "", newUrl);
        setProcessingPayment(false);
        return;
      }

      try {
        // Handle MOMO callback
        if (resultCode) {
          if (resultCode === "0") {
            notify("success", "Payment successful!");
            await processSuccessfulPayment("momo");
            // Mark as processed
            if (orderData?.tempOrderId) {
              sessionStorage.setItem(
                `processed_${orderData.tempOrderId}`,
                "true"
              );
            }
          } else {
            notify("error", "Payment failed!", "topRight", "error");
            if (buy_now_product) {
              router.push("/order/now");
            } else {
              router.push("/cart");
            }
          }
        }
        // Handle VNPAY callback
        else if (vnp_TransactionStatus !== null && vnp_OrderInfo !== null) {
          // Clear URL parameters without refreshing
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(null, "", newUrl);

          if (vnp_TransactionStatus === "00" || vnp_ResponseCode === "00") {
            await processSuccessfulPayment("vnpay");
            // Mark as processed
            if (vnp_TxnRef) {
              sessionStorage.setItem(`processed_${vnp_TxnRef}`, "true");
            } else if (orderData?.tempOrderId) {
              sessionStorage.setItem(
                `processed_${orderData.tempOrderId}`,
                "true"
              );
            }
          } else {
            notify("error", "Payment failed!", "topRight", "error");
            if (buy_now_product) {
              router.push("/order/now");
            } else {
              router.push("/cart");
            }
          }
        }
      } catch (error) {
        console.error("Error processing payment callback:", error);
        notify("error", "Payment failed!", "topRight", "error");
      } finally {
        setProcessingPayment(false);
      }
    };

    handlePaymentCallback();
  }, [searchParams, router, notify]);

  // Function to process successful payment
  const processSuccessfulPayment = async (paymentMethod) => {
    try {
      // Check if we have pending order data
      const pendingOrderData = sessionStorage.getItem("pendingOrderData");
      if (!pendingOrderData) {
        console.warn("No pending order data found");
        return false;
      }

      const orderData = JSON.parse(pendingOrderData);

      // Check if transaction is too old (more than 30 minutes)
      if (
        orderData.timestamp &&
        Date.now() - orderData.timestamp > 30 * 60 * 1000
      ) {
        console.warn("Transaction too old, ignoring");
        sessionStorage.removeItem("pendingOrderData");
        return false;
      }

      const orderItems =
        items.length > 0
          ? items.map((item) => ({
              quantity: quantity || 1,
              total_price: item.price * (quantity || 1),
              product_color_id: colorId,
              product_size_id: sizeId,
              product_id: item.id,
            }))
          : orderData.orderItems;

      const payload = {
        user_id: orderData.userId || user?.id,
        total_amount: orderData.totalAmount || totalAmount,
        payment_method: paymentMethod,
        order_items: orderItems,
        transaction_id: orderData.tempOrderId,
      };

      console.log("Creating order with payload:", payload);

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

      // Clear all related session storage
      sessionStorage.removeItem("buy_now_product");
      sessionStorage.removeItem("buy_now_product_colorId");
      sessionStorage.removeItem("buy_now_product_sizeId");
      sessionStorage.removeItem("buy_now_product_quantity");
      sessionStorage.removeItem("discount");
      sessionStorage.removeItem("total");
      sessionStorage.removeItem("pendingOrderData");

      notify(
        "Order Created",
        "Your order has been created successfully.",
        "topRight",
        "success"
      );

      // Refresh orders list
      fetchOrders();

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

  useEffect(() => {
    if (tabParam) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);

  const fetchOrders = useCallback(async () => {
    if (!userId || selectedTab !== "orders") return;

    setLoadingOrders(true);
    try {
      const data = await getUserOrders(userId);
      // Only update if data has actually changed
      setOrders((prevOrders) => {
        const isDifferent = JSON.stringify(data) !== JSON.stringify(prevOrders);
        return isDifferent ? data : prevOrders;
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, [userId, selectedTab]);

  const fetchWishlists = useCallback(async () => {
    if (!userId || selectedTab !== "wishlist") return;

    setLoadingWishlist(true);
    try {
      const data = await getUserWishlists(userId);
      // Only update if data has actually changed
      setWishlistItems((prevItems) => {
        const isDifferent = JSON.stringify(data) !== JSON.stringify(prevItems);
        return isDifferent ? data : prevItems;
      });
    } catch (error) {
      console.error("Error fetching wishlists:", error);
    } finally {
      setLoadingWishlist(false);
    }
  }, [userId, selectedTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  const handleTabChange = (e) => {
    setSelectedTab(e.key);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
          <Menu
            mode="inline"
            selectedKeys={[selectedTab]}
            onClick={handleTabChange}
            className="border-0"
            items={[
              { key: "orders", icon: <ShoppingOutlined />, label: "My Orders" },
              {
                key: "wishlist",
                icon: <HeartOutlined />,
                label: "My Wishlists",
              },
              {
                key: "profile",
                icon: <UserOutlined />,
                label: "My Profile",
              },
            ]}
          />
        </div>

        <div className="space-y-6">
          {selectedTab === "orders" && (
            <OrdersList
              orders={orders}
              loading={loadingOrders}
              notify={notify}
            />
          )}

          {selectedTab === "wishlist" && (
            <WishlistItems
              wishlistItems={wishlistItems}
              loading={loadingWishlist}
              notify={notify}
              onRefresh={fetchWishlists} // Pass only the refresh function
            />
          )}

          {selectedTab === "profile" && user && (
            <UserProfile user={user} orders={orders} />
          )}
        </div>
      </div>
    </div>
  );
}
