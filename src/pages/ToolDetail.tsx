import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  url: string;
  icon: string;
  category: string;
  clicks: number;
}

const ToolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTool();
    }
  }, [id]);

  const fetchTool = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTool(data);
    } catch (error) {
      console.error('Error fetching tool:', error);
      toast.error("Failed to load tool");
      navigate('/tools');
    } finally {
      setLoading(false);
    }
  };

  const handleVisit = async () => {
    if (!tool) return;

    try {
      // Increment click count
      await supabase
        .from('tools')
        .update({ clicks: tool.clicks + 1 })
        .eq('id', tool.id);

      // Update local state
      setTool(prev => prev ? { ...prev, clicks: prev.clicks + 1 } : null);

      // Open tool URL
      window.open(tool.url, '_blank');
      toast.success("Opening tool...");
    } catch (error) {
      console.error('Error updating clicks:', error);
      // Still open the URL even if count update fails
      window.open(tool.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading tool...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tool) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
        <div className="absolute bottom-[20%] left-[10%] text-4xl animate-float opacity-15">🦇</div>
      </div>

      <Navigation />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/tools')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Button>
        </div>

        {/* Tool Details */}
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header Card */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="flex items-start gap-6">
                <div className="text-8xl">{tool.icon}</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-4xl">{tool.name}</CardTitle>
                    <span className="text-sm px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      {tool.category}
                    </span>
                  </div>
                  <CardDescription className="text-lg">
                    {tool.description || "A helpful tool for your gaming needs"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Stats */}
              <div className="flex items-center gap-6 p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{tool.clicks.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Visits</p>
                  </div>
                </div>
              </div>

              {/* Visit Button */}
              <Button 
                size="lg" 
                className="w-full text-lg py-6 gap-3"
                onClick={handleVisit}
              >
                <ExternalLink className="w-5 h-5" />
                Visit {tool.name}
              </Button>

              {/* Additional Info */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">About This Tool</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{tool.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">External Website</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      This tool will open in a new tab. Make sure to allow pop-ups if prompted.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Description Card */}
          {tool.description && (
            <Card>
              <CardHeader>
                <CardTitle>What You Can Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolDetail;
