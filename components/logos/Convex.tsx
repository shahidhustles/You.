import Image from "next/image";

export default function Convex(props: { className?: string }) {
  return (
    <Image
      src="/convex.png"
      alt="Convex Logo"
      width={24}
      height={24}
      className={props.className}
    />
  );
}
