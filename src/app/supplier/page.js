"use client";
import { getProductBySupplierID } from "@/apiServices/products/page";
import { getSupplierByUserID } from "@/apiServices/suppliers/page";
import { Overview } from "@/components/overview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RecentSales from "@/components/ui/recent-sales";
import { MessageSquare, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [supplierID, setSupplierID] = useState("");
  const [userID, setUserID] = useState("");
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalReviews: 0,
    totalOrderValue: 0,
    isLoading: true,
  });
  useEffect(() => {
    const fetchSupplier = async () => {
      const userData = sessionStorage.getItem("user");
      if (!userData) return;

      try {
        const user = JSON.parse(userData);
        setUserID(user.id);
        const supplier = await getSupplierByUserID(user.id);
        setSupplierID(supplier.id);
      } catch (error) {
        console.error("Fetch supplier error:", error);
      }
    };

    fetchSupplier();
  }, []);

  useEffect(() => {
    if (!supplierID) return;

    async function fetchDashboardData() {
      try {
        setDashboardData((prev) => ({ ...prev, isLoading: true }));

        const [products, ordersResponse, reviewsResponse] = await Promise.all([
          getProductBySupplierID(supplierID),
          fetch(`${BASE_URL}/api/supplier/orders/${userID}`),
          fetch(`${BASE_URL}/api/suppliers/reviews/${userID}`),
        ]);

        if (!ordersResponse.ok || !reviewsResponse.ok) {
          throw new Error("Failed to load data from API");
        }

        const orders = await ordersResponse.json();
        const reviews = await reviewsResponse.json();

        const pendingOrdersCount = orders.reduce((count, order) => {
          const orderItems = Array.isArray(order.order_items)
            ? order.order_items
            : [];
          return (
            count +
            orderItems.filter((item) => item.status === "pending").length
          );
        }, 0);
        const totalOrderValue = orders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || "0"),
          0
        );

        const formattedAmount = parseFloat(totalOrderValue)
          .toFixed(3)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        setDashboardData({
          totalProducts: products.length || 0,
          totalOrders: orders.length || 0,
          pendingOrders: pendingOrdersCount || 0,
          totalReviews: reviews.length || 0,
          totalOrderValue: formattedAmount || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchDashboardData();
  }, [supplierID, userID]);


  if (dashboardData.isLoading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="grid gap-2">
            <p className="text-sm font-medium leading-none">Welcome back</p>
            <p className="text-xs text-muted-foreground">
              Supplier Dashboard Overview
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalProducts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalOrders}
            </div>
            <div className="text-2xl font-bold">
              {dashboardData.totalOrderValue} VND
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.pendingOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalReviews}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made {dashboardData.totalOrders} sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
