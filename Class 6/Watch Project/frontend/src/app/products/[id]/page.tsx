import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products").select("*, categories(*)").eq("id", id).single();

  if (!product) notFound();

  const { data: related } = await supabase
    .from("products").select("*").eq("brand", product.brand).neq("id", product.id).limit(4);

  return <ProductDetailClient product={product} relatedProducts={related || []} />;
}
