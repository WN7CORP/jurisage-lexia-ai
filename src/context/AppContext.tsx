
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchLawData, LawData, Article } from "@/utils/googleSheetsAPI";

interface AppContextProps {
  laws: LawData[];
  currentLaw: LawData | null;
  currentArticle: Article | null;
  fontSize: number;
  favorites: Article[];
  notes: { [articleId: string]: string };
  highlightedTexts: { [articleId: string]: { text: string; color: string }[] };
  isLoading: boolean;
  error: string | null;
  setCurrentLaw: (law: LawData | null) => void;
  setCurrentArticle: (article: Article | null) => void;
  setFontSize: (size: number) => void;
  toggleFavorite: (article: Article) => void;
  updateNote: (articleId: string, note: string) => void;
  addHighlight: (articleId: string, text: string, color: string) => void;
  removeHighlight: (articleId: string, index: number) => void;
  searchArticle: (lawId: string, articleNumber: string) => Promise<Article | null>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [laws, setLaws] = useState<LawData[]>([]);
  const [currentLaw, setCurrentLaw] = useState<LawData | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [favorites, setFavorites] = useState<Article[]>([]);
  const [notes, setNotes] = useState<{ [articleId: string]: string }>({});
  const [highlightedTexts, setHighlightedTexts] = useState<{
    [articleId: string]: { text: string; color: string }[];
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLawData();
        setLaws(data);
        setIsLoading(false);
      } catch (err) {
        setError("Erro ao carregar dados: " + (err instanceof Error ? err.message : String(err)));
        setIsLoading(false);
      }
    };

    // Load persisted data
    const loadPersistedData = () => {
      const storedFontSize = localStorage.getItem("fontSize");
      const storedFavorites = localStorage.getItem("favorites");
      const storedNotes = localStorage.getItem("notes");
      const storedHighlights = localStorage.getItem("highlights");

      if (storedFontSize) setFontSize(Number(storedFontSize));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedHighlights) setHighlightedTexts(JSON.parse(storedHighlights));
    };

    loadData();
    loadPersistedData();
  }, []);

  // Persist data when changed
  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
    localStorage.setItem("favorites", JSON.stringify(favorites));
    localStorage.setItem("notes", JSON.stringify(notes));
    localStorage.setItem("highlights", JSON.stringify(highlightedTexts));
  }, [fontSize, favorites, notes, highlightedTexts]);

  const toggleFavorite = (article: Article) => {
    setFavorites((prev) => {
      const index = prev.findIndex((a) => a.id === article.id);
      if (index === -1) {
        return [...prev, article];
      } else {
        return prev.filter((a) => a.id !== article.id);
      }
    });
  };

  const updateNote = (articleId: string, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [articleId]: note,
    }));
  };

  const addHighlight = (articleId: string, text: string, color: string) => {
    setHighlightedTexts((prev) => {
      const articleHighlights = prev[articleId] || [];
      return {
        ...prev,
        [articleId]: [...articleHighlights, { text, color }],
      };
    });
  };

  const removeHighlight = (articleId: string, index: number) => {
    setHighlightedTexts((prev) => {
      const articleHighlights = [...(prev[articleId] || [])];
      articleHighlights.splice(index, 1);
      return {
        ...prev,
        [articleId]: articleHighlights,
      };
    });
  };

  const searchArticle = async (lawId: string, articleNumber: string): Promise<Article | null> => {
    const law = laws.find((l) => l.id === lawId);
    if (!law) return null;

    const article = law.articles.find((a) => a.number === articleNumber);
    return article || null;
  };

  const value = {
    laws,
    currentLaw,
    currentArticle,
    fontSize,
    favorites,
    notes,
    highlightedTexts,
    isLoading,
    error,
    setCurrentLaw,
    setCurrentArticle,
    setFontSize,
    toggleFavorite,
    updateNote,
    addHighlight,
    removeHighlight,
    searchArticle,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
