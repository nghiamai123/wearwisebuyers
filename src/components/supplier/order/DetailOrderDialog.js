import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DetailOrderDialog({ isOpen, onClose, order }) {
  if (!order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id} Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Order Information
              </h3>
              <Card>
                <CardContent className="p-4">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Order ID:</dt>
                    <dd>#{order.id}</dd>

                    <dt className="font-medium">User ID:</dt>
                    <dd>{order.user_id}</dd>

                    <dt className="font-medium">Total Amount:</dt>
                    <dd>
                      {(Number.parseFloat(order.total_amount) * 1000).toLocaleString()}{" "}
                      VND
                    </dd>

                    <dt className="font-medium">Payment Method:</dt>
                    <dd>{order.payment_method}</dd>

                    <dt className="font-medium">Order Date:</dt>
                    <dd>{formatDate(order.order_date)}</dd>

                    <dt className="font-medium">Created At:</dt>
                    <dd>{formatDate(order.created_at)}</dd>

                    <dt className="font-medium">Updated At:</dt>
                    <dd>{formatDate(order.updated_at)}</dd>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Order Summary
              </h3>
              <Card>
                <CardContent className="p-4">
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="font-medium">Total Items:</dt>
                      <dd>{order.order_items.length}</dd>
                    </div>

                    <div className="flex justify-between">
                      <dt className="font-medium">Total Amount:</dt>
                      <dd className="font-bold">
                        {(Number.parseFloat(order.total_amount) * 1000).toLocaleString()}{" "}
                        VND
                      </dd>
                    </div>

                    <hr className="my-2 border-t border-gray-200" />

                    <div>
                      <dt className="font-medium mb-2">Status Summary:</dt>
                      <dd className="grid gap-1">
                        {Array.from(
                          new Set(order.order_items.map((item) => item.status))
                        ).map((status, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            <span>
                              {
                                order.order_items.filter(
                                  (item) => item.status === status
                                ).length
                              }{" "}
                              items
                            </span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Order Items
            </h3>
            <div className="grid gap-4">
              {order.order_items.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Item #{item.id}</CardTitle>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <dl className="grid md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Product ID:</dt>
                        <dd>{item.product_id}</dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">Quantity:</dt>
                        <dd>{item.quantity}</dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">Total Price:</dt>
                        <dd className="font-medium">
                          {(Number.parseFloat(item.price) * 1000).toLocaleString()}{" "}
                          VND
                        </dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">Color ID:</dt>
                        <dd>{item.product_color_id}</dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">Size ID:</dt>
                        <dd>{item.product_size_id}</dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">Created At:</dt>
                        <dd>{formatDate(item.created_at)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
