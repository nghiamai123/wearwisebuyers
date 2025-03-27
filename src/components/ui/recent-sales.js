import React, { useEffect, useState } from "react";
import { useNotification } from "@/apiServices/NotificationService";

export default function RecentSales() {
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const notify = useNotification();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          notify("User information not found!", "error");
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.id;
        const response = await fetch(
          `${BASE_URL}/api/supplier/orders/${userId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data);

        const userTotals = data.reduce((acc, order) => {
          const userName = order.user_name;
          const userEmail = order.user_email;
          const orderTotal = order.order_items.reduce((sum, item) => {
            return sum + item.quantity * item.price;
          }, 0);

          if (!acc[userName]) {
            acc[userName] = { total: 0, email: userEmail };
          }
          acc[userName].total += orderTotal;

          return acc;
        }, {});

        const sortedTotals = Object.entries(userTotals)
          .map(([userName, { total, email }]) => ({ userName, total, email }))
          .sort((a, b) => b.total - a.total).slice(0, 8);

        setTotals(sortedTotals);
      } catch (error) {
        console.error("Fetch orders error:", error);
        notify("Failed to fetch orders!","","topRight", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        totals.map(({ userName, total, email }) => (
          <div className="flex items-center" key={userName}>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            <div className="ml-auto font-medium">
              +{total.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} VND
            </div>
          </div>
        ))
      )}
    </div>
  );
}
