
import React, { useState } from "react";
import { Article } from "@/utils/googleSheetsAPI";
import { exportToPDF, PDFExportOptions, PDFExportContent } from "@/utils/pdfExport";
import { useApp } from "@/context/AppContext";
import { AIExplanationResponse } from "@/utils/geminiAPI";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown, PenSquare, CircleAlert } from "lucide-react";

interface PDFExportProps {
  article: Article;
  lawTitle: string;
  explanation: AIExplanationResponse;
}

const PDFExport: React.FC<PDFExportProps> = ({ article, lawTitle, explanation }) => {
  const { notes } = useApp();
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    title: `Artigo ${article.number} - ${lawTitle}`,
    author: "",
    includeExplanation: true,
    includeExample: true,
    includeNotes: true,
  });
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);

  // Handle options change
  const handleOptionChange = (field: keyof PDFExportOptions, value: any) => {
    setExportOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle export button click
  const handleExport = async () => {
    setExporting(true);
    setExportSuccess(null);
    
    try {
      const content: PDFExportContent = {
        articleNumber: article.number,
        articleContent: article.content,
        explanation: explanation.explanation,
        example: explanation.example,
        notes: notes[article.id] || "",
        lawTitle: lawTitle
      };
      
      const success = await exportToPDF(content, exportOptions);
      setExportSuccess(success);
      
      if (success) {
        setTimeout(() => {
          setDialogOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setExportSuccess(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Artigo como PDF</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do PDF</Label>
            <Input
              id="title"
              value={exportOptions.title}
              onChange={(e) => handleOptionChange("title", e.target.value)}
              placeholder="Título do documento"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author">Autor (opcional)</Label>
            <Input
              id="author"
              value={exportOptions.author || ""}
              onChange={(e) => handleOptionChange("author", e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExplanation"
                checked={exportOptions.includeExplanation}
                onCheckedChange={(checked) => 
                  handleOptionChange("includeExplanation", checked)
                }
              />
              <label
                htmlFor="includeExplanation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir explicação da IA
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExample"
                checked={exportOptions.includeExample}
                onCheckedChange={(checked) => 
                  handleOptionChange("includeExample", checked)
                }
              />
              <label
                htmlFor="includeExample"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir exemplo prático
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeNotes"
                checked={exportOptions.includeNotes}
                onCheckedChange={(checked) => 
                  handleOptionChange("includeNotes", checked)
                }
              />
              <label
                htmlFor="includeNotes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir minhas anotações
              </label>
            </div>
          </div>
          
          {exportSuccess === false && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm flex items-center gap-2">
              <CircleAlert className="h-5 w-5 text-destructive" />
              Ocorreu um erro ao exportar o PDF. Tente novamente.
            </div>
          )}
          
          {exportSuccess === true && (
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-primary" />
              PDF exportado com sucesso!
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] mr-2"></span>
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExport;
