import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <div className="flex items-center justify-center w-full">
      <Link href='/'>
        <Image src={'/probso-logo.png'} alt="logo" width={120} height={120} />
      </Link>
    </div>
  )
}
