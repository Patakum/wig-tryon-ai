import Image from "next/image";
import { Wig } from "@/src/types";

export default function WigCard({
  wig,
  onSelect,
}: {
  wig: Wig;
  onSelect: (wigId: string) => void;
}) {
  return (
    <div
      className="border rounded-xl p-2 cursor-pointer hover:shadow-md"
      onClick={() => onSelect(wig.id)}
    >
      <img
        src={wig.imageUrl}
        alt={wig.name}
        className="rounded-lg w-full h-48 object-cover"
      />
      <p className="mt-2 text-center">{wig.name}</p>
    </div>
  );
}