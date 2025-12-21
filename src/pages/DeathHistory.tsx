import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skull, ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";

interface DeathRecord {
  id: string;
  death_cause: string;
  scenario_context: string | null;
  created_at: string;
}

const DeathHistory = () => {
  const navigate = useNavigate();
  const [deaths, setDeaths] = useState<DeathRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeaths();
  }, []);

  const fetchDeaths = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to view your death history");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('game_deaths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeaths(data || []);
    } catch (error) {
      console.error('Error fetching deaths:', error);
      toast.error("Failed to load death history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/mini-games-hub")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Adventure
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Skull className="w-12 h-12 text-destructive" />
            <h1 className="text-4xl md:text-5xl font-bold">Death Chronicle</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your journey through the many ways to meet your end
          </p>
          <Badge variant="destructive" className="text-lg px-4 py-2 mt-4">
            Total Deaths: {deaths.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">
            Loading your demises...
          </div>
        ) : deaths.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Skull className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-2">No deaths yet!</p>
              <p className="text-muted-foreground">You haven't died in the Verse... yet.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => navigate("/mini-games-hub")}
              >
                Start Your Adventure
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deaths.map((death, index) => (
              <Card key={death.id} className="border-destructive/20 hover:border-destructive/40 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Badge variant="outline" className="text-xs">
                          Death #{deaths.length - index}
                        </Badge>
                        {death.death_cause}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(death.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {death.scenario_context && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {death.scenario_context}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/mini-games-hub")}
          >
            Return to Adventure
          </Button>
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/powers")}
          >
            Back to Powers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeathHistory;
