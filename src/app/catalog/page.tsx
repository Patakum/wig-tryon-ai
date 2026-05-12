'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Wig } from '@/src/types';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';

export default function CatalogPage() {
  const [wigs, setWigs] = useState<Wig[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchWigs = async () => {
      const res = await axios.get('/api/wigs');
      setWigs(res.data);
    };

    fetchWigs();
  }, []);

  const handleSelect = (wigId: string) => {
    router.push(`/upload?wigId=${wigId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-amber-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-800 flex items-center justify-center">
              <span className="text-xs font-bold">שק</span>
            </div>
          </div>
          <h1 className="text-center flex-1 font-semibold text-gray-800">WIGS</h1>
          <div className="flex items-center gap-3">
            <button className="p-1">
              <Search size={20} className="text-gray-800" />
            </button>
            <button className="p-1">
              <User size={20} className="text-gray-800" />
            </button>
            <button className="p-1">
              <Heart size={20} className="text-gray-800" />
            </button>
            <button className="p-1">
              <ShoppingBag size={20} className="text-gray-800" />
            </button>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {wigs.map((wig) => (
            <div
              key={wig.id}
              className="cursor-pointer"
              onClick={() => handleSelect(wig.id)}
            >
              <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={wig.imageUrl}
                  alt={wig.name}
                  width={300}
                  height={400}
                  className="w-full h-64 object-cover"
                  unoptimized
                />
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-700 mb-1">{wig.name}</p>
                {wig.price && (
                  <p className="text-sm font-semibold text-gray-800">{wig.price}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
