import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface AccessGateProps {
  children: React.ReactNode;
}

const ACCESS_CODE = "WildPhilosopher2025"; // Change this to your desired access code
const STORAGE_KEY = "site_access_granted";

const AccessGate = ({ children }: AccessGateProps) => {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user already has access
    const accessGranted = sessionStorage.getItem(STORAGE_KEY);
    if (accessGranted === "true") {
      setHasAccess(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code === ACCESS_CODE) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setHasAccess(true);
      toast.success("Access granted");
    } else {
      toast.error("Invalid access code");
      setCode("");
    }
  };

  // Show loading while checking access
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has access, show the app
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show access code gate
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Access Required</h1>
            <p className="text-muted-foreground">
              Please enter the access code to continue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-wider"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={!code}>
            Submit
          </Button>
        </form>

        <div className="text-xs text-center text-muted-foreground">
          Contact the administrator if you need access
        </div>
      </Card>
    </div>
  );
};

export default AccessGate;
