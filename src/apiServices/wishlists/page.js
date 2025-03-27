// Function to get user wishlists
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
export async function getUserWishlists(userId) {
    try {
      // Get token from sessionStorage
      const token = sessionStorage.getItem("accessToken")
  
      if (!token) {
        throw new Error("Authentication token not found")
      }
  
      const response = await fetch(`${BASE_URL}/api/wishlists`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        throw new Error(`Error fetching wishlists: ${response.statusText}`)
      }
  
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error in getUserWishlists:", error)
      throw error
    }
  }
  
  // Function to remove item from wishlist
  export async function removeWishlistItem(itemId) {
    try {
      // Get token from sessionStorage
      const token = sessionStorage.getItem("accessToken")
  
      if (!token) {
        throw new Error("Authentication token not found")
      }
  
      const response = await fetch(`${BASE_URL}/api/wishlists/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        throw new Error(`Error removing wishlist item: ${response.statusText}`)
      }
  
      return true
    } catch (error) {
      console.error("Error in removeWishlistItem:", error)
      throw error
    }
  }
  
  