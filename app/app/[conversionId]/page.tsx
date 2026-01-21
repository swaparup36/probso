"use client";

import { auth } from "@clerk/nextjs/server";
import Converter from "@/components/converter"

export default async function ConversionPage() {
  const { userId } = await auth();

  if (!userId) {
    window.location.href = "/";
  }

  return (
    <Converter />
  )
}
