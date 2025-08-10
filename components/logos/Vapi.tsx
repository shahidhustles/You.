import Image from "next/image";

export default function Vapi(props: { className?: string }) {
  return (
    <Image
      src="/vapi.png"
      alt="Vapi Logo"
      width={24}
      height={24}
      className={props.className}
    />
  );
}
