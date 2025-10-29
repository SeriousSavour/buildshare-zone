import { useState, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface AdminAuthProps {
  children: ReactNode;
}

const AdminAuth = ({ children }: AdminAuthProps) => {
  const [code, setCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleNumberClick = (num: string) => {
    if (code.length < 4) {
      setCode(code + num);
    }
  };

  const handleClear = () => {
    setCode("");
  };

  const handleSubmit = () => {
    if (code === "9700") {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect code",
        variant: "destructive",
      });
      setCode("");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 backdrop-blur-sm bg-card/95 border-2 border-primary/20">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Access
          </h1>
          <p className="text-muted-foreground">Enter the 4-digit code</p>
        </div>

        {/* Code Display */}
        <div className="flex justify-center gap-3 py-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-lg border-2 border-primary/30 bg-background flex items-center justify-center text-2xl font-bold"
            >
              {code[i] ? "•" : ""}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="lg"
              onClick={() => handleNumberClick(num)}
              className="text-xl font-semibold h-16 hover:bg-primary/10 hover:border-primary"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            size="lg"
            onClick={handleClear}
            className="text-lg font-semibold h-16 hover:bg-destructive/10 hover:border-destructive"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNumberClick("0")}
            className="text-xl font-semibold h-16 hover:bg-primary/10 hover:border-primary"
          >
            0
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleSubmit}
            disabled={code.length !== 4}
            className="text-lg font-semibold h-16"
          >
            Enter
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminAuth;
