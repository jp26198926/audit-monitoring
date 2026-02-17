"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster position="top-right" />;
}
