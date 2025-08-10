import Image from "next/image";

export default function NextJS(props: { className?: string }) {
  return (
    <Image
      src="/next.svg"
      alt="Next.js Logo"
      width={24}
      height={24}
      className={props.className}
    />
  );
}
