
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Search, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface SearchBarProps {
  onSearch: (lawId: string, articleNumber: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const { laws } = useApp();
  const [selectedLawId, setSelectedLawId] = useState<string>("");
  const [articleNumber, setArticleNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Handle search
  const handleSearch = () => {
    setError(null);
    
    if (!selectedLawId) {
      setError("Selecione uma legislação");
      return;
    }
    
    if (!articleNumber) {
      setError("Digite o número do artigo");
      return;
    }
    
    onSearch(selectedLawId, articleNumber);
  };

  // Handle clear
  const handleClear = () => {
    setSelectedLawId("");
    setArticleNumber("");
    setError(null);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 p-4 bg-card rounded-lg shadow-neo">
        <h2 className="text-lg font-medium">Pesquisar Artigo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="law-select" className="block text-sm font-medium mb-1">
              Legislação
            </label>
            <Select 
              value={selectedLawId} 
              onValueChange={(value) => {
                setSelectedLawId(value);
                setError(null);
              }}
            >
              <SelectTrigger id="law-select" className="w-full bg-secondary">
                <SelectValue placeholder="Selecione uma legislação" />
              </SelectTrigger>
              <SelectContent>
                {laws.map((law) => (
                  <SelectItem key={law.id} value={law.id}>
                    {law.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="article-input" className="block text-sm font-medium mb-1">
              Artigo
            </label>
            <div className="relative">
              <Input
                id="article-input"
                type="text"
                value={articleNumber}
                onChange={(e) => {
                  setArticleNumber(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Nº do artigo"
                className="bg-secondary pr-8"
              />
              {articleNumber && (
                <button
                  type="button"
                  onClick={() => setArticleNumber("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClear}>
            Limpar
          </Button>
          <Button onClick={handleSearch} className="gap-1">
            <Search className="h-4 w-4" />
            Pesquisar
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
