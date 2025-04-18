
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Menu, Search, BookOpen, Star, Settings, ArrowUp, Scale, Glasses } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { fontSize, setFontSize } = useApp();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll events to show/hide the scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Font size adjustment
  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 1);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(fontSize - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/70 backdrop-blur-md px-4">
        <div className="flex items-center space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar w-80">
              <SideMenu />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary animate-pulse-light" />
            <h1 className="font-serif text-xl font-semibold tracking-tight">
              <span className="text-primary">WAD</span>
              <span className="text-foreground">MECON</span>
              <span className="text-primary">2025</span>
              <span className="text-xs ml-1 text-muted-foreground">PRO</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 12}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Glasses className="h-5 w-5" />
                  <span className="sr-only">Diminuir fonte</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Diminuir fonte</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="font-mono text-sm mx-2">{fontSize}px</div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={increaseFontSize}
                  disabled={fontSize >= 24}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Glasses className="h-5 w-5 scale-110" />
                  <span className="sr-only">Aumentar fonte</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aumentar fonte</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        {/* Sidebar (visible on larger screens) */}
        <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-border bg-sidebar flex-col">
          <SideMenu />
        </aside>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-neo animate-fade-in z-50 hover:bg-accent transition-colors"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// Side menu component
const SideMenu = () => {
  const { laws } = useApp();

  return (
    <div className="flex flex-col h-full py-4">
      <h2 className="px-4 text-lg font-medium text-sidebar-foreground mb-6">
        Menu
      </h2>

      <div className="px-3 space-y-1">
        <Button variant="ghost" className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          Pesquisar
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <BookOpen className="mr-2 h-4 w-4" />
          Ver Todos
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Star className="mr-2 h-4 w-4" />
          Favoritos
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </div>

      <div className="mt-8 px-4">
        <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
          Legislações
        </h3>
        <div className="space-y-1 px-1 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin">
          {laws.map((law) => (
            <Button
              key={law.id}
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto text-sm font-normal"
            >
              {law.title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;
