import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import FloatingBackground from "./FloatingBackground";

interface CodeData {
  code: string;
  content: string;
}

const TreasureHunt = () => {
  const [inputCode, setInputCode] = useState("");
  const [currentState, setCurrentState] = useState<"input" | "error" | "success">("input");
  const [codeData, setCodeData] = useState<CodeData[]>([]);
  const [foundContent, setFoundContent] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Load CSV data
  useEffect(() => {
    const loadCodes = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}codes.csv?ts=${Date.now()}`,
          { cache: "no-store" }
        );
        const csvText = await response.text();
        const lines = csvText.split("\n").slice(1); // Skip header
        const data = lines
          .filter(line => line.trim())
          .map(line => {
            const commaIndex = line.indexOf(",");
            if (commaIndex === -1) return null;

            const code = line.substring(0, commaIndex).trim();
            const content = line.substring(commaIndex + 1).replace(/^"(.*)"$/, '$1').trim();

            return {
              code,
              content
            };
          })
          .filter(Boolean) as CodeData[];
        setCodeData(data);
      } catch (error) {
        console.error("Error loading codes:", error);
      }
    };
    loadCodes();
  }, []);

  const handleSubmit = () => {
    const foundCode = codeData.find(item => item.code === inputCode.trim());

    if (foundCode) {
      setFoundContent(foundCode.content);
      setCurrentState("success");
    } else {
      setCurrentState("error");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleTryAgain = () => {
    setCurrentState("input");
    setInputCode("");
    setFoundContent("");
  };

  const isImageUrl = (content: string) => {
    return content.startsWith("http") && (content.includes(".jpg") || content.includes(".png") || content.includes(".gif") || content.includes(".jpeg"));
  };

  if (currentState === "error") {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-error-red relative overflow-hidden">
        <FloatingBackground />
        <Card className={`w-11/12 max-w-md bg-error-dark border-none shadow-2xl ${isShaking ? 'shake' : ''}`}>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">💀</div>
            <h1 className="text-4xl font-bold text-white mb-6 animate-pulse">
              MAUVAIS CODE
            </h1>
            <p className="text-white/80 mb-8 text-lg">
              Essaie encore, aventurier !
            </p>
            <Button
              onClick={handleTryAgain}
              className="bg-white text-error-dark hover:bg-white/90 font-bold text-lg py-6 px-8 rounded-xl transform transition-all duration-200 hover:scale-105"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentState === "success") {
    return (
      <div className="min-h-[100svh] flex items-start justify-center pt-2 bg-success-light relative overflow-hidden">
        <FloatingBackground />
        <Card className="w-11/12 max-w-2xl bg-white border-none shadow-2xl bounce-in">
          <CardContent className="p-8 text-center">
            <div className="text-6xl -mt-2 mb-3">🗺️</div>
            <h1 className="text-2xl font-bold text-success-green mb-3">
              Code trouvé !
            </h1>
            {isImageUrl(foundContent) ? (
              <div className="mb-8">
                <img
                  src={foundContent}
                  alt="Indice trouvé"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                />
              </div>
            ) : (
              <div className="bg-success-light p-4 rounded-lg mb-8 h-56">
                <ScrollArea className="h-full w-full [&>div>div[style]]:!pr-6">
                  <div className="pr-4">
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                      {foundContent}
                    </p>
                  </div>
                </ScrollArea>
              </div>
            )}
            <Button
              onClick={handleTryAgain}
              className="bg-success-green hover:bg-success-green/90 text-white font-bold text-lg py-6 px-8 rounded-xl transform transition-all duration-200 hover:scale-105"
            >
              Continuer l'aventure
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-background relative overflow-hidden">
      <FloatingBackground />
      <Card className="w-11/12 max-w-md bg-white border-none shadow-2xl pulse-glow">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-6">🗝️</div>
          <h1 className="text-3xl font-bold text-treasure-gold mb-6">
            Chasse au Trésor
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Entre le code& secret pour ton prochain indice !
          </p>
          <div className="space-y-6">
            <Input
              type="text"
              placeholder="Code secret."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="text-center text-xl py-6 rounded-xl border-2 border-treasure-gold/50 focus:border-treasure-gold"
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputCode.trim()}
              className="w-full bg-treasure-gold hover:bg-treasure-gold/90 text-foreground font-bold text-xl py-6 rounded-xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              Découvrir l'indice 🔍
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreasureHunt;