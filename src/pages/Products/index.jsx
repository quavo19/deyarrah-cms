import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { productService } from "@/services/product.service";
import { SearchInput } from "@/components/ui/SearchInput";
import Button from "@/components/ui/Button";
import TableSkeleton from "@/components/ui/TableSkeleton";
import Badge from "@/components/ui/Badge";
import Image from "@/components/ui/Image";
import { Package, Plus, RefreshCw } from "lucide-react";

const Products = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const {
    data: productsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["products", page, perPage, search],
    queryFn: () =>
      productService.getAllProducts({
        page,
        per_page: perPage,
        search: search || undefined,
      }),
    refetchOnMount: true,
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta || {};
  const totalPages = meta.total_pages || 1;

  const handleViewDetails = (productId) => {
    navigate(`/inventory/${productId}`);
  };

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Products</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your product inventory.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              placeholder="Search products by name or description..."
            />
          </div>
          <div className="w-full max-w-sm sm:w-1/2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200! hover:bg-gray-300! text-gray-700!"
              auto
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={() => navigate("/inventory/new")}
              className="flex items-center justify-center gap-2 flex-1"
            >
              <Plus className="w-4 h-4" />
              Create Product
            </Button>
          </div>
        </div>

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Total Stock
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Cart / Wishlist
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {search
                        ? "No products found matching your search"
                        : "No products found"}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const attrs = product.attributes || {};
                    const productImageUrl =
                      attrs.images?.[0]?.url || attrs.image_url;
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-2 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(product.id)}
                            className="flex items-center text-left cursor-pointer"
                          >
                            <div className="shrink-0 h-14 w-14">
                              <Image
                                src={productImageUrl}
                                alt={attrs.name || "Product image"}
                                className="h-14 w-14"
                                iconClassName="h-8 w-8"
                                fallbackIcon={Package}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 hover:underline">
                                {attrs.name || "—"}
                              </div>
                              {attrs.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {attrs.description}
                                </div>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          <Badge
                            variant={
                              attrs.bookable_type === "bulk"
                                ? "info"
                                : "success"
                            }
                          >
                            {attrs.bookable_type
                              ? attrs.bookable_type.replace("_", " ")
                              : "—"}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          <Badge variant={attrs.active ? "success" : "still"}>
                            {attrs.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {attrs.total_stock !== undefined
                            ? attrs.total_stock
                            : "—"}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                          <div className="text-gray-900">
                            {attrs.cart_count || 0} in cart
                          </div>
                          <div className="text-xs text-gray-500">
                            {attrs.wishlist_count || 0} wishlisted
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {meta.current_page || 1} of {totalPages}
              {meta.total_count && ` (${meta.total_count} total products)`}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

