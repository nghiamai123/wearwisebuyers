"use client";

import React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/apiServices/NotificationService";
import DetailOrderDialog from "@/components/supplier/order/DetailOrderDialog";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState({});
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const itemsPerPage = 10;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Get user data from sessionStorage
      const userData = sessionStorage.getItem("user");
      if (!userData) {
        notify("User information not found!", "error");
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await fetch(`${BASE_URL}/api/supplier/orders/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Fetch orders error:", error);
      notify("Failed to fetch orders!","","topRight", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [BASE_URL]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toString().includes(searchTerm) ||
      order.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_date.includes(searchTerm)
  );

  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    if (sortConfig.key === "id" || sortConfig.key === "user_id") {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    } else if (sortConfig.key === "total_amount") {
      aValue = Number.parseFloat(a[sortConfig.key]);
      bValue = Number.parseFloat(b[sortConfig.key]);
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = (sortedFilteredOrders || []).slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleUpdateStatus = async () => {
    try {
      const userData = sessionStorage.getItem("user");
      if (!userData) {
        notify("User information not found!", "error");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/orders/update-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          status: newStatus,
          orderItemId: selectedOrderItem.order_item_id,
          userId: selectedOrder.user_id,
          orderId: selectedOrder.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update local state
      const updatedOrders = orders.map((order) => {
        if (order.id === selectedOrder.id) {
          const updatedOrderItems = order.order_items.map((item) => {
            if (item.id === selectedOrderItem.id) {
              return { ...item, status: newStatus };
            }
            return item;
          });
          return { ...order, order_items: updatedOrderItems };
        }
        return order;
      });

      setOrders(updatedOrders);
      setIsStatusDialogOpen(false);
      notify("Order status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating order status:", error);
      notify("Failed to update order status!", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Orders
        </Button>
      </div>

      <div className="flex items-center mb-6">
        <Input
          placeholder="Search orders by ID, payment method, or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("id")}
                className="cursor-pointer"
              >
                Order ID
                {sortConfig.key === "id" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("user_id")}
                className="cursor-pointer"
              >
                User ID
                {sortConfig.key === "user_id" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("total_amount")}
                className="cursor-pointer"
              >
                Total Amount
                {sortConfig.key === "total_amount" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("payment_method")}
                className="cursor-pointer"
              >
                Payment Method
                {sortConfig.key === "payment_method" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead
                onClick={() => handleSort("order_date")}
                className="cursor-pointer"
              >
                Order Date
                {sortConfig.key === "order_date" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading orders...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.user_id}</TableCell>
                    <TableCell>
                      {(
                        Number.parseFloat(order.total_amount) * 1000
                      ).toLocaleString()}{" "}
                      VND
                    </TableCell>
                    <TableCell>{order.payment_method}</TableCell>
                    <TableCell>
                      {new Date(order.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {order.order_items.length} items
                        {expandedOrders[order.id] ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedOrders[order.id] && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/30 p-4">
                          <h3 className="font-medium mb-2">Order Items</h3>
                          <div className="grid gap-4">
                            {order.order_items.map((item, index) => (
                              <Card key={index} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                  <CardTitle className="text-sm">
                                    Item #{item.id}
                                  </CardTitle>
                                  {getStatusBadge(item.status)}
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">
                                        Product ID:
                                      </p>
                                      <p>{item.product_id}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Quantity:
                                      </p>
                                      <p>{item.quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Total Price:
                                      </p>
                                      <p>
                                        {(
                                          Number.parseFloat(item.price) * 1000
                                        ).toLocaleString()}{" "}
                                        VND
                                      </p>
                                    </div>
                                    <div className="flex items-end">
                                      {item.status === "pending" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedOrder(order);
                                            setSelectedOrderItem(item);
                                            setNewStatus(item.status);
                                            setIsStatusDialogOpen(true);
                                          }}
                                        >
                                          Update Status
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>

      <DetailOrderDialog
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
      />

      <AlertDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change the status for order item #{selectedOrderItem?.id}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateStatus}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
