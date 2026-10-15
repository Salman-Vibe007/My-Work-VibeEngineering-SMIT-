"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/database";
import { useCartStore } from "@/store/cart";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/placeholder.jpg"];

  const discount = getDiscountPercent(product.price, product.original_price);

  const specs = [
    { label: "Brand", value: product.brand },
    { label: "Movement", value: product.movement_type },
    { label: "Case Material", value: product.case_material },
    { label: "Case Size", value: product.case_size },
    { label: "Dial Color", value: product.dial_color },
    { label: "Water Resistance", value: product.water_resistance },
    { label: "Style", value: product.style },
    { label: "SKU", value: product.sku },
  ].filter((s) => s.value);

  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#4682B4] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="hover:text-[#4682B4] transition-colors"
          >
            Products
          </Link>
          <span>/</span>
          <span className="text-[#8B4513]">{product.name}</span>
        </nav>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FFFDD0]/30">
              {discount && discount > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{discount}%
                </div>
              )}
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-3">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-[#4682B4] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-contain p-1 bg-[#FFFDD0]/30"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <p className="text-[#8B4513] uppercase tracking-wider text-sm font-semibold">
                {product.brand}
              </p>
            )}

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-[#4682B4]">
                {formatPrice(product.price)}
              </span>
              {product.original_price &&
                product.original_price > product.price && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  inStock ? "bg-[#2E8B57]" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  inStock ? "text-[#2E8B57]" : "text-red-500"
                }`}
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Quantity Selector */}
            {inStock && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
                inStock
                  ? added
                    ? "bg-[#2E8B57] cursor-default"
                    : "bg-[#4682B4] hover:bg-[#3A6E9A] cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {added ? "Added to Cart!" : inStock ? "Add to Cart" : "Out of Stock"}
            </button>

            {/* Specifications */}
            {specs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase">{spec.label}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              More from {product.brand}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
