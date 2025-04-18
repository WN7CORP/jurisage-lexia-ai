
import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { 
  BookOpen, Copy, FileText, Play, Pause, Star, Share, 
  MessageSquareText, Download, Bookmark, Edit, VolumeX, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIExplanation from "./AIExplanation";
import NotesManager from "./NotesManager";
import { speechService, SpeechState } from "@/utils/speechSynthesis";
import { exportToPDF } from "@/utils/pdfExport";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleViewProps {
  lawId: string;
  articleNumber: string;
}

const ArticleView: React.FC<ArticleViewProps> = ({ lawId, articleNumber }) => {
  const { 
    laws, 
    currentArticle, 
    setCurrentArticle, 
    favorites, 
    toggleFavorite, 
    notes, 
    fontSize 
  } = useApp();
  const [loading, setLoading] = useState(true);
  const [speechState, setSpeechState] = useState<SpeechState>({
    isSpeaking: false,
    isPaused: false,
    text: '',
    currentPosition: 0
  });

  // Find the article and law
  useEffect(() => {
    const findArticle = async () => {
      setLoading(true);
      const law = laws.find(l => l.id === lawId);
      
      if (law) {
        const article = law.articles.find(a => a.number === articleNumber);
        if (article) {
          setCurrentArticle(article);
        } else {
          setCurrentArticle(null);
        }
      } else {
        setCurrentArticle(null);
      }
      
      setLoading(false);
    };
    
    findArticle();
    
    // Clean up speech when component unmounts
    return () => {
      speechService.stop();
    };
  }, [lawId, articleNumber, laws, setCurrentArticle]);

  // Subscribe to speech state changes
  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState(state);
    });
    
    return unsubscribe;
  }, []);

  const law = laws.find(l => l.id === lawId);
  const isFavorited = currentArticle && favorites.some(f => f.id === currentArticle.id);

  // Handle speech
  const handleSpeech = () => {
    if (speechState.isSpeaking) {
      if (speechState.isPaused) {
        speechService.resume();
      } else {
        speechService.pause();
      }
    } else if (currentArticle) {
      const lawTitle = law?.title || '';
      const content = `Artigo ${currentArticle.number}. ${currentArticle.content}`;
      
      const voices = speechService.getPortugueseVoices();
      const voice = voices.length > 0 ? voices[0] : null;
      
      speechService.speak(content, {
        rate: 0.9,
        pitch: 1,
        volume: 1,
        voice,
        lang: 'pt-BR'
      });
    }
  };

  // Handle stop speech
  const handleStopSpeech = () => {
    speechService.stop();
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    if (currentArticle) {
      navigator.clipboard.writeText(
        `Art. ${currentArticle.number} - ${currentArticle.content}`
      );
      // You could add a toast notification here
    }
  };

  // Handle export to PDF
  const handleExportPDF = async () => {
    if (currentArticle) {
      const articleNote = notes[currentArticle.id] || '';
      
      // Assuming you have the explanation and example from the AI component
      // In a real app, you would get these from the AIExplanation component
      const exportContent = {
        articleNumber: currentArticle.number,
        articleContent: currentArticle.content,
        explanation: "Explicação detalhada do artigo...", // Placeholder
        example: "Exemplo prático de aplicação...", // Placeholder
        notes: articleNote,
        lawTitle: law?.title
      };
      
      const exportOptions = {
        title: `Artigo ${currentArticle.number} - ${law?.title}`,
        includeExplanation: true,
        includeExample: true,
        includeNotes: !!articleNote
      };
      
      const success = await exportToPDF(exportContent, exportOptions);
      // You could add a toast notification based on success/failure
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Render not found state
  if (!currentArticle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Artigo não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>O artigo solicitado não foi encontrado na legislação selecionada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-border shadow-neo">
        <CardHeader className="pb-2 bg-card">
          <div className="flex justify-between items-center">
            <CardTitle className="font-serif flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Artigo {currentArticle.number}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(currentArticle)}
                    className={isFavorited ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}
                  >
                    <Star className="h-5 w-5" fill={isFavorited ? "currentColor" : "none"} />
                    <span className="sr-only">{isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {law && <p className="text-sm text-muted-foreground">{law.title}</p>}
        </CardHeader>
        
        <CardContent className="pt-4">
          <div 
            className="prose prose-invert max-w-none" 
            style={{ fontSize: `${fontSize}px` }}
          >
            <p>{currentArticle.content}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-border pt-4 bg-card/50">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar artigo</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExportPDF}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Exportar PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSpeech}
                    className={
                      speechState.isSpeaking 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {speechState.isSpeaking 
                      ? (speechState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />) 
                      : <Volume2 className="h-4 w-4" />}
                    <span className="sr-only">
                      {speechState.isSpeaking 
                        ? (speechState.isPaused ? "Continuar narração" : "Pausar narração") 
                        : "Narrar artigo"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {speechState.isSpeaking 
                    ? (speechState.isPaused ? "Continuar narração" : "Pausar narração") 
                    : "Narrar artigo"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {speechState.isSpeaking && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleStopSpeech}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <VolumeX className="h-4 w-4" />
                      <span className="sr-only">Parar narração</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Parar narração</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigator.share({
                      title: `Artigo ${currentArticle.number} - ${law?.title}`,
                      text: currentArticle.content,
                      url: window.location.href
                    })}
                  >
                    <Share className="h-4 w-4" />
                    <span className="sr-only">Compartilhar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compartilhar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
      
      <Tabs defaultValue="explanation" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="explanation" className="flex-1">
            <MessageSquareText className="h-4 w-4 mr-2" />
            Explicação da IA
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Anotações
          </TabsTrigger>
          <TabsTrigger value="bookmark" className="flex-1">
            <Bookmark className="h-4 w-4 mr-2" />
            Outros Artigos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="explanation" className="mt-4">
          <AIExplanation article={currentArticle} lawTitle={law?.title || ''} />
        </TabsContent>
        
        <TabsContent value="notes" className="mt-4">
          <NotesManager articleId={currentArticle.id} />
        </TabsContent>
        
        <TabsContent value="bookmark" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Artigos Relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              {law?.articles
                .filter(a => a.id !== currentArticle.id)
                .slice(0, 5)
                .map((article) => (
                  <Button
                    key={article.id}
                    variant="ghost"
                    className="w-full justify-start text-left mb-1 h-auto py-2"
                    onClick={() => {
                      setCurrentArticle(article);
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      <span className="font-medium">Art. {article.number}</span>
                      <span className="text-muted-foreground ml-2 truncate">
                        {article.content.substring(0, 50)}...
                      </span>
                    </span>
                  </Button>
                ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Ver todos os artigos desta lei</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArticleView;
