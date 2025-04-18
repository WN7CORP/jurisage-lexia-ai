
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { 
  AudioLines, Camera, Circle, Download, Image, Mic, MicOff, 
  Send, Square, Trash, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getAutoAnnotations } from "@/utils/geminiAPI";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesManagerProps {
  articleId: string;
}

// Helper for highlight colors
const HIGHLIGHT_COLORS = [
  { name: "Amarelo", class: "bg-highlight-yellow", value: "yellow" },
  { name: "Verde", class: "bg-highlight-green", value: "green" },
  { name: "Azul", class: "bg-highlight-blue", value: "blue" },
  { name: "Rosa", class: "bg-highlight-pink", value: "pink" },
];

const NotesManager: React.FC<NotesManagerProps> = ({ articleId }) => {
  const { notes, updateNote, highlightedTexts, addHighlight, removeHighlight } = useApp();
  const [noteText, setNoteText] = useState(notes[articleId] || "");
  const [highlightColor, setHighlightColor] = useState<string>("yellow");
  const [selectedText, setSelectedText] = useState<string>("");
  const [audioRecording, setAudioRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiSuggested, setAiSuggested] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize note from context
  useEffect(() => {
    setNoteText(notes[articleId] || "");
  }, [articleId, notes]);

  // Handle note changes and save to context
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNoteText(newNote);
    updateNote(articleId, newNote);
  };

  // Handle selection for highlighting
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const selectedText = textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      ).trim();
      
      if (selectedText) {
        setSelectedText(selectedText);
      } else {
        setSelectedText("");
      }
    }
  };

  // Apply highlight to selected text
  const applyHighlight = () => {
    if (selectedText && highlightColor) {
      addHighlight(articleId, selectedText, highlightColor);
      setSelectedText("");
    }
  };

  // Get AI suggested notes
  const getAISuggestions = async () => {
    try {
      setLoading(true);
      const result = await getAutoAnnotations("");
      setAiSuggested(result.annotations);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add AI suggestion to notes
  const addAISuggestion = (suggestion: string) => {
    const newNote = noteText ? `${noteText}\n\n${suggestion}` : suggestion;
    setNoteText(newNote);
    updateNote(articleId, newNote);
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });
      
      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      });
      
      mediaRecorderRef.current.start();
      setAudioRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && audioRecording) {
      mediaRecorderRef.current.stop();
      setAudioRecording(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index]); // Clean up URL
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Remove audio
  const removeAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }
  };

  // Highlight text component
  const HighlightedTexts = () => {
    const highlights = highlightedTexts[articleId] || [];
    
    if (highlights.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-2 mt-4">
        <h3 className="text-sm font-medium">Destaques:</h3>
        <div className="space-y-1">
          {highlights.map((highlight, index) => (
            <div 
              key={index} 
              className="flex items-center group"
            >
              <div 
                className={`flex-1 p-2 rounded text-sm ${
                  highlight.color === "yellow" ? "bg-highlight-yellow text-black" :
                  highlight.color === "green" ? "bg-highlight-green text-black" :
                  highlight.color === "blue" ? "bg-highlight-blue text-white" :
                  "bg-highlight-pink text-white"
                }`}
              >
                {highlight.text}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeHighlight(articleId, index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover destaque</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-neo-light">
      <CardHeader className="pb-2 bg-card/50">
        <CardTitle className="text-lg">Anotações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Textarea
          ref={textareaRef}
          value={noteText}
          onChange={handleNoteChange}
          onSelect={handleTextSelection}
          placeholder="Adicione suas anotações aqui..."
          className="min-h-[150px] resize-y"
        />
        
        {selectedText && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Destacar:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span 
                    className={`h-3 w-3 rounded-full ${
                      HIGHLIGHT_COLORS.find(c => c.value === highlightColor)?.class
                    }`}
                  />
                  {HIGHLIGHT_COLORS.find(c => c.value === highlightColor)?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {HIGHLIGHT_COLORS.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onClick={() => setHighlightColor(color.value)}
                    className="flex items-center gap-2"
                  >
                    <span className={`h-3 w-3 rounded-full ${color.class}`} />
                    {color.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              size="sm" 
              onClick={applyHighlight}
              variant="secondary"
            >
              Aplicar
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setSelectedText("")}
            >
              Cancelar
            </Button>
          </div>
        )}
        
        <HighlightedTexts />
        
        {audioUrl && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-2">Áudio Gravado:</h3>
            <div className="flex items-center">
              <audio controls src={audioUrl} className="w-full h-10" />
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={removeAudio}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Remover áudio</span>
              </Button>
            </div>
          </div>
        )}
        
        {images.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-2">Imagens:</h3>
            <div className="grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Imagem ${index + 1}`}
                    className="rounded border border-border w-full h-32 object-cover"
                  />
                  <button
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remover imagem</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        
        {aiSuggested.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-2">Sugestões da IA:</h3>
            <div className="space-y-2">
              {aiSuggested.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="bg-primary/10 p-2 rounded-md flex items-center justify-between group"
                >
                  <span className="text-sm">{suggestion}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => addAISuggestion(suggestion)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Adicionar sugestão</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border pt-4 bg-card/50">
        <div className="flex items-center gap-2">
          {audioRecording ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
              className="gap-2"
            >
              <MicOff className="h-4 w-4" />
              Parar Gravação
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startRecording}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Gravar Áudio
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Adicionar Imagem
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            multiple
          />
        </div>
        
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={getAISuggestions}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Sugestões da IA
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Plus and Sparkles icons since they're not included in the imports
const Plus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Sparkles = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default NotesManager;
