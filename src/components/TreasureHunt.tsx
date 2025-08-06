// FILE: src/components/TreasureHunt.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import FloatingBackground from "./FloatingBackground";

interface CodeData {
  code: string;
  content: string;
}

const TreasureHunt = () => {
  const [inputCode, setInputCode] = useState("");
  const [currentState, setCurrentState] =
    useState<"input" | "error" | "success">("input");
  const [codeData, setCodeData] = useState<CodeData[]>([]);
  const [foundContent, setFoundContent] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // --- Audio handling ---
  const audioEl = useRef<HTMLAudioElement | null>(null);

  // --- Scroll hint handling for long text ---
  const textScrollerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const isImageUrl = (content: string) =>
    content.startsWith("http") &&
    (content.includes(".jpg") ||
      content.includes(".png") ||
      content.includes(".gif") ||
      content.includes(".jpeg"));

  const isAudioUrl = (content: string) =>
    /^https?:\/\//i.test(content) && /\.mp3(\?|#|$)/i.test(content);

  // Try to auto-play after a successful match (user-gesture friendly)
  useEffect(() => {
    if (currentState === "success" && isAudioUrl(foundContent) && audioEl.current) {
      audioEl.current.load();
      audioEl.current.play().catch(() => {
        // Autoplay may be blocked; visible controls below are the fallback.
      });
    }
  }, [currentState, foundContent]);

  // Load CSV data (keeps your BASE_URL logic for prod paths)
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
          .filter((line) => line.trim())
          .map((line) => {
            const commaIndex = line.indexOf(",");
            if (commaIndex === -1) return null;

            const code = line.substring(0, commaIndex).trim();
            const content = line
              .substring(commaIndex + 1)
              .replace(/^"(.*)"$/, "$1")
              .trim();

            return { code, content };
          })
          .filter(Boolean) as CodeData[];
        setCodeData(data);
      } catch (error) {
        console.error("Error loading codes:", error);
      }
    };
    loadCodes();
  }, []);

  // Detect overflow in the green text box and show a scroll hint until the user scrolls
  useEffect(() => {
    const el = textScrollerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      setShowScrollHint(hasOverflow && !atBottom);
    };

    checkOverflow();

    const onScroll = () => checkOverflow();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [foundContent]);

  const handleSubmit = () => {
    const foundCode = codeData.find((item) => item.code === inputCode.trim());

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
    // Stop audio if playing
    if (audioEl.current) {
      audioEl.current.pause();
      audioEl.current.currentTime = 0;
    }
    setCurrentState("input");
    setInputCode("");
    setFoundContent("");
  };

  // --- Screens ---
  if (currentState === "error") {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-error-red relative overflow-hidden">
        <FloatingBackground />
        <Card
          className={`w-11/12 max-w-md bg-error-dark border-none shadow-2xl ${
            isShaking ? "shake" : ""
          }`}
        >
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">💀</div>
            <h1 className="text-4xl font-bold text-white mb-6 animate-pulse">
              MAUVAIS CODE
            </h1>
            <p className="text-white/80 mb-8 text-lg">Essaie encore, aventurier !</p>
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
    const successWrapperBase =
      "min-h-[100svh] flex items-start justify-center pt-2 bg-success-light relative";
    const successWrapper = `${successWrapperBase} ${
      isAudioUrl(foundContent) ? "" : "overflow-hidden"
    }`;

    return (
      <div className={successWrapper}>
        <FloatingBackground />
        <Card
          className={`w-11/12 max-w-2xl bg-white border-none shadow-2xl relative z-20 ${
            isAudioUrl(foundContent) ? "" : "bounce-in"
          }`}
        >
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
            ) : isAudioUrl(foundContent) ? (
              <div className="mb-8">
                <audio
                  ref={audioEl}
                  controls
                  src={(foundContent ?? "").trim()}
                  className="w-full block min-h-[44px] bg-gray-100 rounded border border-gray-300"
                  style={{ transform: "translateZ(0)" }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  If the audio does not start automatically, press ▶︎.
                </p>
              </div>
            ) : (
              // Text case with persistent scroll hint
              <div className="relative mb-8">
                <div
                  ref={textScrollerRef}
                  className="bg-success-light p-4 rounded-lg h-56 overflow-y-auto"
                  style={{
                    scrollbarGutter: "stable",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line pr-4">
                    {foundContent}
                  </p>
                </div>

                {showScrollHint && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 flex items-end justify-center rounded-b-lg bg-gradient-to-t from-success-light to-transparent">
                    <div className="mb-2 px-2 py-1 text-xs font-medium rounded-full bg-white/85 shadow">
                      ⬇️
                    </div>
                  </div>
                )}
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

  // Input screen
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
            Entre le code secret pour ton prochain indice !
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