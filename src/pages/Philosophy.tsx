import { greekPhilosopherQuotes } from "@/lib/greekQuotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Scroll } from "lucide-react";

const Philosophy = () => {
  // Group quotes by philosopher
  const quotesByPhilosopher = greekPhilosopherQuotes.reduce((acc, quote) => {
    if (!acc[quote.author]) {
      acc[quote.author] = [];
    }
    acc[quote.author].push(quote);
    return acc;
  }, {} as Record<string, typeof greekPhilosopherQuotes>);

  const philosopherInfo: Record<string, { bio: string; greek: string; era: string }> = {
    "Socrates": {
      bio: "Ancient Greek philosopher from Athens, considered the founder of Western philosophy. He never wrote down his teachings; we know them through his student Plato.",
      greek: "Σωκράτης",
      era: "c. 470–399 BC"
    },
    "Plato": {
      bio: "Student of Socrates and teacher of Aristotle, founder of the Academy in Athens. His philosophical works explored justice, beauty, equality, and truth.",
      greek: "Πλάτων",
      era: "c. 428–348 BC"
    },
    "Aristotle": {
      bio: "Student of Plato and tutor to Alexander the Great. His writings cover subjects including physics, biology, zoology, metaphysics, logic, ethics, and poetry.",
      greek: "Ἀριστοτέλης",
      era: "384–322 BC"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Scroll className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Ancient Wisdom</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Greek Philosophy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore timeless wisdom from the great philosophers of ancient Greece. 
            Their insights continue to shape our understanding of life, ethics, and the pursuit of knowledge.
          </p>
          <p className="text-2xl text-primary/70 italic">φιλοσοφία (philosophía) - Love of Wisdom</p>
        </div>

        {/* Philosophers */}
        <div className="space-y-8">
          {Object.entries(quotesByPhilosopher).map(([philosopher, quotes], index) => {
            const info = philosopherInfo[philosopher];
            return (
              <Card 
                key={philosopher} 
                className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                        <Book className="w-8 h-8 text-primary" />
                        {philosopher}
                      </CardTitle>
                      <p className="text-xl text-primary/70 italic mb-2">{info.greek}</p>
                      <p className="text-sm text-muted-foreground font-medium mb-3">{info.era}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {info.bio}
                      </p>
                    </div>
                    <div className="text-6xl opacity-10">
                      {philosopher === "Socrates" ? "🏛️" : philosopher === "Plato" ? "📚" : "🎓"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                    {quotes.map((quote, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/70 transition-all duration-200 group"
                        >
                          <p className="text-base leading-relaxed mb-3 italic text-foreground/90 group-hover:text-foreground transition-colors">
                            "{quote.quote}"
                          </p>
                          {quote.greek && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              <p className="text-sm text-primary/70 italic font-medium">
                                {quote.greek}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Quote */}
        <div className="mt-12 text-center p-8 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/20 animate-fade-in">
          <p className="text-xl italic text-foreground/80 mb-2">
            "Philosophy is written in this grand book — I mean the universe — which stands continually open to our gaze, 
            but it cannot be understood unless one first learns to comprehend the language in which it is written."
          </p>
          <p className="text-sm text-muted-foreground">— Inspired by ancient wisdom</p>
        </div>
      </div>
    </div>
  );
};

export default Philosophy;
