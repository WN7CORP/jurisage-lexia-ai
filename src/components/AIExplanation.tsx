
import React, { useState, useEffect } from "react";
import { Article } from "@/utils/googleSheetsAPI";
import { 
  getArticleExplanation, 
  getAutoAnnotations, 
  askAIQuestion, 
  AIExplanationResponse,
  AIQueryResponse
} from "@/utils/geminiAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { HelpCircle, MessageSquare, BookOpen, Lightbulb, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface AIExplanationProps {
  article: Article;
  lawTitle: string;
}

const AIExplanation: React.FC<AIExplanationProps> = ({ article, lawTitle }) => {
  const [explanation, setExplanation] = useState<AIExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIQueryResponse | null>(null);
  const [answerLoading, setAnswerLoading] = useState(false);

  // Fetch explanation on component mount or when article changes
  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticleExplanation(article.content);
        setExplanation(data);
      } catch (err) {
        setError("Erro ao carregar explicação da IA: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [article]);

  // Handle asking a question to the AI
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;

    try {
      setAnswerLoading(true);
      const answer = await askAIQuestion(article.content, userQuestion);
      setAiAnswer(answer);
      // Don't clear the question so the user can see what they asked
    } catch (err) {
      setError("Erro ao obter resposta da IA: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAnswerLoading(false);
    }
  };

  // Handle key press in the textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-neo-light">
        <CardHeader className="pb-2 bg-card/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Explicação
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-line">{explanation?.explanation}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-neo-light">
        <CardHeader className="pb-2 bg-card/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Exemplo Prático
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-line">{explanation?.example}</p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-4 bg-card/50">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Tirar Dúvidas com IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Tirar Dúvidas sobre o Artigo {article.number}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="pt-4 pb-2">
                    <h4 className="text-sm font-medium mb-2">Artigo:</h4>
                    <p className="text-xs text-muted-foreground">{article.content}</p>
                  </CardContent>
                </Card>
                
                {aiAnswer && (
                  <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Resposta da IA:</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{aiAnswer.answer}</p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                  <Textarea
                    placeholder="Digite sua pergunta sobre este artigo..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAskQuestion} 
                      disabled={!userQuestion.trim() || answerLoading}
                      className="gap-2"
                    >
                      {answerLoading ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIExplanation;
