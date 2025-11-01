import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Shadow = () => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Check if it's a URL or search query
      if (searchValue.includes('.') || searchValue.startsWith('http')) {
        window.open(searchValue.startsWith('http') ? searchValue : `https://${searchValue}`, '_blank');
      } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchValue)}`, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Shadow Title */}
        <h1 className="text-7xl md:text-8xl font-bold text-[#6b9aff] drop-shadow-[0_0_30px_rgba(107,154,255,0.5)] mb-12">
          Shadow
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search or enter a URL"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-14 bg-[#0d1221] border-[#1a2332] text-white placeholder:text-gray-500 rounded-lg pl-4 pr-12 focus:border-[#6b9aff] focus:ring-[#6b9aff]"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b9aff] hover:text-[#8ab0ff] transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* App Icon Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl bg-[#4a7fff] hover:bg-[#6b9aff] transition-all duration-300"
          >
            <div className="w-6 h-6 grid grid-cols-2 gap-1">
              <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Shadow;
