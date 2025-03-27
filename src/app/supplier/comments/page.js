"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ArrowUp, ArrowDown, RefreshCw, ChevronDown, ChevronUp, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNotification } from "@/apiServices/NotificationService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ReviewsPage() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedProducts, setExpandedProducts] = useState({})
  const notify = useNotification()
  const [isLoading, setIsLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  })
  const itemsPerPage = 10
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      // Get user data from sessionStorage
      const userData = sessionStorage.getItem("user")
      if (!userData) {
        notify("User information not found!", "error")
        setIsLoading(false)
        return
      }

      // Parse user data and extract ID
      const user = JSON.parse(userData)
      const userId = user.id

      // Call the supplier-specific reviews API
      const response = await fetch(`${BASE_URL}/api/suppliers/reviews/${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`)
      }

      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Fetch reviews error:", error)
      notify("Failed to fetch reviews!", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [BASE_URL])

  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const toggleProductExpand = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.id.toString().includes(searchTerm),
  )

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aValue, bValue

    if (sortConfig.key === "id") {
      aValue = a[sortConfig.key]
      bValue = b[sortConfig.key]
    } else if (sortConfig.key === "price") {
      aValue = Number.parseFloat(a[sortConfig.key].replace(/\./g, ""))
      bValue = Number.parseFloat(b[sortConfig.key].replace(/\./g, ""))
    } else if (sortConfig.key === "rating_avg") {
      aValue = a[sortConfig.key]
      bValue = b[sortConfig.key]
    } else {
      aValue = a[sortConfig.key]
      bValue = b[sortConfig.key]
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = (sortedFilteredProducts || []).slice(indexOfFirstItem, indexOfLastItem)

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="ml-2">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Reviews</h1>
        <Button onClick={fetchReviews} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Reviews
        </Button>
      </div>

      <div className="flex items-center mb-6">
        <Input
          placeholder="Search products by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("id")} className="cursor-pointer">
                Product ID
                {sortConfig.key === "id" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                Product Name
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                Price
                {sortConfig.key === "price" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead onClick={() => handleSort("rating_avg")} className="cursor-pointer">
                Average Rating
                {sortConfig.key === "rating_avg" &&
                  (sortConfig.direction === "asc" ? (
                    <ArrowUp className="inline ml-1" />
                  ) : (
                    <ArrowDown className="inline ml-1" />
                  ))}
              </TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading reviews...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleProductExpand(product.id)}
                  >
                    <TableCell className="font-medium">#{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.price} VND</TableCell>
                    <TableCell>{renderStarRating(product.rating_avg)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {product.reviews.length} reviews
                        {expandedProducts[product.id] ? (
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
                          e.stopPropagation()
                          setSelectedProduct(product)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedProducts[product.id] && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-muted/30 p-4">
                          <h3 className="font-medium mb-2">Customer Reviews</h3>
                          <div className="grid gap-4">
                            {product.reviews.length > 0 ? (
                              product.reviews.map((review) => (
                                <Card key={review.id} className="overflow-hidden">
                                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm">Review #{review.id}</CardTitle>
                                      <p className="text-xs text-muted-foreground">
                                        User ID: {review.user_id} • {formatDate(review.created_at)}
                                      </p>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {renderStarRating(review.rating)}
                                    </Badge>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2">
                                    <p className="text-sm">{review.content}</p>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground py-4">No reviews available</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No reviews found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
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

      {/* Product Review Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Product Information</h3>
                <Card>
                  <CardContent className="p-4">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="font-medium">Product ID:</dt>
                      <dd>#{selectedProduct?.id}</dd>

                      <dt className="font-medium">Name:</dt>
                      <dd>{selectedProduct?.name}</dd>

                      <dt className="font-medium">Price:</dt>
                      <dd>{selectedProduct?.price} VND</dd>

                      <dt className="font-medium">Average Rating:</dt>
                      <dd>{renderStarRating(selectedProduct?.rating_avg || 0)}</dd>

                      <dt className="font-medium">Total Reviews:</dt>
                      <dd>{selectedProduct?.reviews.length}</dd>
                    </dl>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Rating Summary</h3>
                <Card>
                  <CardContent className="p-4">
                    {selectedProduct && (
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = selectedProduct.reviews.filter((r) => r.rating === rating).length
                          const percentage =
                            selectedProduct.reviews.length > 0
                              ? Math.round((count / selectedProduct.reviews.length) * 100)
                              : 0

                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <div className="flex items-center w-16">
                                <span className="font-medium">{rating}</span>
                                <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-yellow-400 h-2.5 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs w-12 text-right">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">All Reviews</h3>
              <div className="grid gap-4">
                {selectedProduct?.reviews.length > 0 ? (
                  selectedProduct.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-sm">User #{review.user_id}</CardTitle>
                            <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                          </div>
                          <div>{renderStarRating(review.rating)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm">{review.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No reviews available</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

