import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Converter from "@/components/converter"

export default async function ConversionPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <Converter />
  )
}
