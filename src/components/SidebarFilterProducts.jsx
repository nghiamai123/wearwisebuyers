"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, Search, ChevronDown, Sliders } from "lucide-react"
import { getColors } from "@/apiServices/colors/page"

export default function SidebarFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [rawPriceRange, setRawPriceRange] = useState({ min: "", max: "" })
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [sortPrice, setSortPrice] = useState("")

  const minPriceRef = useRef(null)
  const maxPriceRef = useRef(null)
  const searchRef = useRef(null)

  const [focusedInput, setFocusedInput] = useState(null)

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    categories: true,
    colors: true,
    sizes: true,
    sort: true,
  })

  const [colors, setColors] = useState([])
  const [loadingColors, setLoadingColors] = useState(true)

  const categories = [
    { id: "T-shirt", name: "T-shirt" },
    { id: "Shirt", name: "Shirt" },
    { id: "Shorts", name: "Shorts" },
    { id: "Hoodies", name: "Hoodies" },
    { id: "Pants", name: "Pants" },
    { id: "Sweater", name: "Sweater" },
  ]

  const sizes = [
    { id: "S", name: "S" },
    { id: "M", name: "M" },
    { id: "L", name: "L" },
    { id: "XL", name: "XL" },
  ]

  // Format a number with thousand separators
  const formatWithThousandSeparator = (value) => {
    if (!value) return ""
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  useEffect(() => {
    const fetchColors = async () => {
      setLoadingColors(true)
      try {
        const colorsData = await getColors()
        setColors(colorsData.data || [])
      } catch (error) {
        console.error("Error fetching colors:", error)
      } finally {
        setLoadingColors(false)
      }
    }

    fetchColors()
  }, [])

  useEffect(() => {
    if (focusedInput === "min" && minPriceRef.current) {
      minPriceRef.current.focus()
    } else if (focusedInput === "max" && maxPriceRef.current) {
      maxPriceRef.current.focus()
    } else if (focusedInput === "search" && searchRef.current) {
      searchRef.current.focus()
    }
  }, [focusedInput, priceRange])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (params.has("search")) {
      setSearchTerm(params.get("search") || "")
    }

    if (params.has("minPrice")) {
      const minPrice = params.get("minPrice") || ""
      // Convert back to display format (multiply by 1000 and format)
      const displayValue = minPrice ? formatWithThousandSeparator(Number.parseInt(minPrice, 10) * 1000) : ""
      setPriceRange((prev) => ({ ...prev, min: displayValue }))
      setRawPriceRange((prev) => ({ ...prev, min: minPrice }))
    }

    if (params.has("maxPrice")) {
      const maxPrice = params.get("maxPrice") || ""
      // Convert back to display format (multiply by 1000 and format)
      const displayValue = maxPrice ? formatWithThousandSeparator(Number.parseInt(maxPrice, 10) * 1000) : ""
      setPriceRange((prev) => ({ ...prev, max: displayValue }))
      setRawPriceRange((prev) => ({ ...prev, max: maxPrice }))
    }

    const categoryValues = params.getAll("categories")
    if (categoryValues.length > 0) {
      setSelectedCategories(categoryValues)
    }

    const colorValues = params.getAll("colors")
    if (colorValues.length > 0) {
      setSelectedColors(colorValues)
    }

    const sizeValues = params.getAll("sizes")
    if (sizeValues.length > 0) {
      setSelectedSizes(sizeValues)
    }

    if (params.has("sortPrice")) {
      setSortPrice(params.get("sortPrice"))
    }
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("search", searchTerm.trim())

    router.push(`/products?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const handlePriceChange = (type, value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, "")

    // Store the raw numeric value
    setRawPriceRange((prev) => ({
      ...prev,
      [type]: numericValue,
    }))

    // Format with thousand separators for display
    const formattedValue = formatWithThousandSeparator(numericValue)

    // Update the display value
    setPriceRange((prev) => ({
      ...prev,
      [type]: formattedValue,
    }))
  }

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setFocusedInput(null)
    }, 100)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete("minPrice")
    params.delete("maxPrice")
    params.delete("categories")
    params.delete("colors")
    params.delete("sizes")
    params.delete("sortPrice")

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    }

    // Convert the formatted price values to numeric values and divide by 1000
    if (priceRange.min) {
      const minNumeric = Number.parseInt(priceRange.min.replace(/\./g, ""), 10)
      const minConverted = Math.floor(minNumeric / 1000)
      params.append("minPrice", minConverted.toString())
    }

    if (priceRange.max) {
      const maxNumeric = Number.parseInt(priceRange.max.replace(/\./g, ""), 10)
      const maxConverted = Math.floor(maxNumeric / 1000)
      params.append("maxPrice", maxConverted.toString())
    }

    selectedCategories.forEach((category) => {
      params.append("categories", category)
    })

    selectedColors.forEach((color) => {
      params.append("colors", color)
    })

    selectedSizes.forEach((size) => {
      params.append("sizes", size)
    })

    if (sortPrice) {
      params.append("sortPrice", sortPrice)
    }

    router.push(`/products?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const resetFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    }

    setSearchTerm(searchTerm)
    setPriceRange({ min: "", max: "" })
    setRawPriceRange({ min: "", max: "" })
    setSelectedCategories([])
    setSelectedColors([])
    setSelectedSizes([])
    setSortPrice("")

    router.push(`/products?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const toggleCategory = (id) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleColor = (id) => {
    setSelectedColors((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSize = (id) => {
    setSelectedSizes((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const activeFilterCount =
    (priceRange.min || priceRange.max ? 1 : 0) +
    selectedCategories.length +
    selectedColors.length +
    selectedSizes.length +
    (sortPrice ? 1 : 0)

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between text-left font-medium text-gray-800 mb-3"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections[section] ? "rotate-180" : ""}`}
        />
      </button>
      {expandedSections[section] && children}
    </div>
  )

  return (
    <>
      <div className="md:hidden sticky top-0 z-10 bg-white py-3 mb-4 border-b border-gray-100">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-full py-2.5 px-4 bg-gray-50 rounded-lg text-gray-700 font-medium shadow-sm hover:bg-gray-100 transition-colors"
        >
          <Sliders className="w-4 h-4 mr-2" />
          Filter Products
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-4 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Filters</h3>
            {activeFilterCount > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">{activeFilterCount} active filters</span>
                <button onClick={resetFilters} className="text-sm text-pink-500 hover:text-pink-600 font-medium">
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            <FilterSection title="Filter by Original Price" section="price">
              <div className="flex items-center gap-2">
                <input
                  ref={minPriceRef}
                  type="text"
                  placeholder="Min"
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange("min", e.target.value)}
                  onFocus={() => handleInputFocus("min")}
                  onBlur={handleInputBlur}
                />
                <span className="text-gray-400">-</span>
                <input
                  ref={maxPriceRef}
                  type="text"
                  placeholder="Max"
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange("max", e.target.value)}
                  onFocus={() => handleInputFocus("max")}
                  onBlur={handleInputBlur}
                />
              </div>
            </FilterSection>

            <FilterSection title="Categories" section="categories">
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Colors" section="colors">
              {loadingColors ? (
                <div className="flex justify-center items-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      className={`w-8 h-8 rounded-full ${
                        selectedColors.includes(color.name)
                          ? "ring-2 ring-offset-2 ring-pink-500"
                          : "border border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color.code }}
                      onClick={() => toggleColor(color.name)}
                      aria-label={`Color: ${color.name}`}
                    />
                  ))}
                </div>
              )}
            </FilterSection>

            <FilterSection title="Sizes" section="sizes">
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      selectedSizes.includes(size.id)
                        ? "bg-pink-500 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleSize(size.id)}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Sort by" section="sort">
              <select
                className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 bg-white"
                value={sortPrice}
                onChange={(e) => setSortPrice(e.target.value)}
              >
                <option value="">Default</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select>
            </FilterSection>

            <button
              onClick={applyFilters}
              className="w-full bg-pink-500 text-white py-2.5 px-4 rounded-md font-medium hover:bg-pink-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex md:hidden">
          <div className="bg-white w-full max-w-sm h-full overflow-y-auto ml-auto">
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Search</h4>
                <form onSubmit={handleSearch} className="flex">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products..."
                    className="flex-1 p-2.5 border border-gray-200 rounded-l-md focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => handleInputFocus("search")}
                    onBlur={handleInputBlur}
                  />
                  <button
                    type="submit"
                    className="bg-pink-500 text-white p-2.5 rounded-r-md hover:bg-pink-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Filter by Original Price</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange("min", e.target.value)}
                    onFocus={() => handleInputFocus("min")}
                    onBlur={handleInputBlur}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="text"
                    placeholder="Max"
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange("max", e.target.value)}
                    onFocus={() => handleInputFocus("max")}
                    onBlur={handleInputBlur}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Categories</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Colors</h4>
                {loadingColors ? (
                  <div className="flex justify-center items-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-pink-500"></div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        className={`w-9 h-9 rounded-full ${
                          selectedColors.includes(color.name)
                            ? "ring-2 ring-offset-2 ring-pink-500"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: color.code }}
                        onClick={() => toggleColor(color.name)}
                        aria-label={`Color: ${color.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Sizes</h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        selectedSizes.includes(size.id)
                          ? "bg-pink-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleSize(size.id)}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Sort by Price</h4>
                <select
                  className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 bg-white"
                  value={sortPrice}
                  onChange={(e) => setSortPrice(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="asc">Price: Low to High</option>
                  <option value="desc">Price: High to Low</option>
                </select>
              </div>

              <div className="sticky bottom-0 bg-white pt-2 pb-4 border-t border-gray-100 mt-6">
                <div className="flex gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-pink-500 text-white py-3 rounded-md font-medium hover:bg-pink-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

