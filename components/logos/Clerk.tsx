import Image from "next/image";

export default function Clerk(props: { className?: string }) {
  return (
    <Image
      src="/clerk.jpeg"
      alt="Clerk Logo"
      width={24}
      height={24}
      className={props.className}
    />
  );
}
