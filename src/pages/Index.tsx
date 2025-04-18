import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import ArticleView from "@/components/ArticleView";
import { Article } from "@/utils/googleSheetsAPI";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const Index = () => {
  const {
    laws,
    isLoading,
    error
  } = useApp();
  const [searchMode, setSearchMode] = useState<"search" | "browse">("search");
  const [searchResults, setSearchResults] = useState<{
    article: Article | null;
    lawId: string;
    articleNumber: string;
  } | null>(null);
  const [browseSelection, setBrowseSelection] = useState<{
    lawId: string;
    articleIndex: number;
  } | null>(null);

  // Handle search
  const handleSearch = (lawId: string, articleNumber: string) => {
    const law = laws.find(l => l.id === lawId);
    if (law) {
      const article = law.articles.find(a => a.number === articleNumber);
      setSearchResults({
        article: article || null,
        lawId,
        articleNumber
      });

      // Reset browse mode selection when searching
      setBrowseSelection(null);
    }
  };

  // Handle browse mode selection
  const handleBrowseSelection = (lawId: string, articleIndex: number) => {
    setBrowseSelection({
      lawId,
      articleIndex
    });

    // Reset search results when browsing
    setSearchResults(null);
  };

  // Get the current article to display
  const getCurrentArticle = () => {
    if (searchMode === "search" && searchResults) {
      return searchResults.article ? {
        lawId: searchResults.lawId,
        articleNumber: searchResults.article.number
      } : null;
    }
    if (searchMode === "browse" && browseSelection) {
      const law = laws.find(l => l.id === browseSelection.lawId);
      if (law && law.articles[browseSelection.articleIndex]) {
        return {
          lawId: browseSelection.lawId,
          articleNumber: law.articles[browseSelection.articleIndex].number
        };
      }
    }
    return null;
  };

  // Navigate to previous or next article in browse mode
  const navigateArticle = (direction: "prev" | "next") => {
    if (!browseSelection) return;
    const law = laws.find(l => l.id === browseSelection.lawId);
    if (!law) return;
    const newIndex = direction === "prev" ? Math.max(0, browseSelection.articleIndex - 1) : Math.min(law.articles.length - 1, browseSelection.articleIndex + 1);
    if (newIndex !== browseSelection.articleIndex) {
      setBrowseSelection({
        ...browseSelection,
        articleIndex: newIndex
      });
    }
  };
  const currentArticle = getCurrentArticle();
  return <Layout>
      <div className="container mx-auto max-w-6xl">
        {isLoading ? <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Scale className="h-12 w-12 text-primary animate-pulse-light mb-4" />
            <h2 className="text-xl font-semibold">Carregando legislações...</h2>
            <p className="text-muted-foreground">Aguarde um momento, estamos preparando tudo para você.</p>
          </div> : error ? <div className="flex flex-col items-center justify-center min-h-[50vh] text-destructive">
            <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div> : <div className="space-y-6">
            <Tabs value={searchMode} onValueChange={v => setSearchMode(v as "search" | "browse")}>
              <TabsList className="w-full">
                <TabsTrigger value="search" className="flex-1">
                  Pesquisar Artigo
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex-1">
                  Navegar por Todos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="search" className="pt-4">
                <SearchBar onSearch={handleSearch} />
              </TabsContent>
              <TabsContent value="browse" className="pt-4">
                <BrowseView laws={laws} selectedLaw={browseSelection?.lawId} selectedIndex={browseSelection?.articleIndex} onSelect={handleBrowseSelection} onNavigate={navigateArticle} />
              </TabsContent>
            </Tabs>

            {currentArticle && <div className="mt-8">
                <ArticleView lawId={currentArticle.lawId} articleNumber={currentArticle.articleNumber} />
              </div>}

            {!currentArticle && !isLoading && <div className="flex flex-col items-center justify-center py-16 text-center">
                <Scale className="h-16 w-16 text-primary/30 mb-6" />
                <h2 className="text-2xl font-serif mb-2">VADEMECUM2025 PRO</h2>
                <p className="text-muted-foreground max-w-lg">
                  Bem-vindo ao seu aplicativo jurídico de consulta. Pesquise qualquer artigo pelo número ou navegue por todas as legislações disponíveis.
                </p>
              </div>}
          </div>}
      </div>
    </Layout>;
};
interface BrowseViewProps {
  laws: any[];
  selectedLaw: string | undefined;
  selectedIndex: number | undefined;
  onSelect: (lawId: string, articleIndex: number) => void;
  onNavigate: (direction: "prev" | "next") => void;
}
const BrowseView: React.FC<BrowseViewProps> = ({
  laws,
  selectedLaw,
  selectedIndex,
  onSelect,
  onNavigate
}) => {
  const [currentLawId, setCurrentLawId] = useState<string>(selectedLaw || laws[0]?.id || "");
  useEffect(() => {
    if (laws.length > 0 && !currentLawId) {
      setCurrentLawId(laws[0].id);
    }
  }, [laws, currentLawId]);
  const currentLaw = laws.find(l => l.id === currentLawId);
  return <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="law-select" className="block text-sm font-medium mb-2">
            Selecione a Legislação
          </label>
          <select id="law-select" className="w-full rounded-md border-border bg-secondary p-2" value={currentLawId} onChange={e => {
          setCurrentLawId(e.target.value);
          if (e.target.value) {
            onSelect(e.target.value, 0); // Select first article when changing law
          }
        }}>
            {laws.map(law => <option key={law.id} value={law.id}>
                {law.title}
              </option>)}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => onNavigate("prev")} disabled={!selectedIndex || selectedIndex === 0}>
            Artigo Anterior
          </Button>
          <Button variant="outline" onClick={() => onNavigate("next")} disabled={!selectedIndex || !currentLaw || selectedIndex >= currentLaw.articles.length - 1}>
            Próximo Artigo
          </Button>
        </div>
      </div>

      {currentLaw && <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">{currentLaw.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {currentLaw.articles.map((article: any, index: number) => <Button key={article.id} variant={selectedLaw === currentLawId && selectedIndex === index ? "default" : "outline"} className="h-auto py-2 justify-start" onClick={() => onSelect(currentLawId, index)}>
                Art. {article.number}
              </Button>)}
          </div>
        </div>}
    </div>;
};
export default Index;