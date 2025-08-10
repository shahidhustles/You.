import Image from "next/image";

export default function Vercel(props: { className?: string }) {
  return (
    <Image
      src="/vercel.svg"
      alt="Vercel Logo"
      width={24}
      height={24}
      className={props.className}
    />
  );
}
