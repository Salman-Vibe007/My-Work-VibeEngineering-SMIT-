"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types/database";

interface AdminProductsClientProps {
  products: Product[];
}

const initialForm = {
  name: "",
  brand: "",
  description: "",
  price: "",
  original_price: "",
  movement_type: "",
  case_material: "",
  case_size: "",
  dial_color: "",
  water_resistance: "",
  style: "",
  stock: "",
  sku: "",
  featured: false,
  images: "",
};

export default function AdminProductsClient({ products: initialProducts }: AdminProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      brand: product.brand,
      description: product.description || "",
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : "",
      movement_type: product.movement_type,
      case_material: product.case_material,
      case_size: product.case_size || "",
      dial_color: product.dial_color || "",
      water_resistance: product.water_resistance || "",
      style: product.style,
      stock: String(product.stock),
      sku: product.sku || "",
      featured: product.featured,
      images: (product.images || []).join("\n"),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const imageUrls = form.images
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      brand: form.brand,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      movement_type: form.movement_type,
      case_material: form.case_material,
      case_size: form.case_size || null,
      dial_color: form.dial_color || null,
      water_resistance: form.water_resistance || null,
      style: form.style,
      stock: Number(form.stock),
      sku: form.sku || null,
      featured: form.featured,
      images: imageUrls,
    };

    if (editingId) {
      const { data, error } = await supabase.from("products").update(payload).eq("id", editingId).select().single();
      if (!error && data) {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (!error && data) {
        setProducts((prev) => [data, ...prev]);
      }
    }

    setLoading(false);
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-1">{products.length} products in catalog</p>
        </div>
        <button onClick={openAddForm} className="bg-[#4682B4] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3A6E9A] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editingId ? "Edit Product" : "Add Product"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Brand *</label>
              <input name="brand" value={form.brand} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Price *</label>
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Original Price</label>
              <input name="original_price" type="number" step="0.01" value={form.original_price} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Movement Type *</label>
              <input name="movement_type" value={form.movement_type} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Case Material *</label>
              <input name="case_material" value={form.case_material} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Case Size</label>
              <input name="case_size" value={form.case_size} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Dial Color</label>
              <input name="dial_color" value={form.dial_color} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Water Resistance</label>
              <input name="water_resistance" value={form.water_resistance} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Style *</label>
              <input name="style" value={form.style} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stock *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Images (one URL per line)</label>
              <textarea name="images" value={form.images} onChange={handleChange} rows={4} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" />
            </div>
            <div className="flex items-center gap-2">
              <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} className="h-4 w-4 rounded border-slate-600 bg-slate-800" />
              <label className="text-sm font-medium text-slate-300">Featured</label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="bg-[#2E8B57] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#257245] disabled:opacity-50 transition-colors">
                {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }} className="bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Brand</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Featured</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-3 text-sm text-slate-200">{product.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{product.brand}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{formatPrice(product.price)}</td>
                <td className={`px-4 py-3 text-sm font-medium ${product.stock <= 5 ? "text-red-400" : "text-slate-200"}`}>
                  {product.stock}
                </td>
                <td className="px-4 py-3 text-sm">
                  {product.featured && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded">Featured</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => openEditForm(product)} className="text-[#4682B4] hover:text-[#5a9fd4] mr-3 font-medium">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
