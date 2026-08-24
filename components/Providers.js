"use client";

import { ShopProvider } from "@/lib/store";

export default function Providers({ children }) {
  return <ShopProvider>{children}</ShopProvider>;
}
