import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BranchFromVerse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [branchName, setBranchName] = useState("");
  const [branchConcept, setBranchConcept] = useState("");
  const [connection, setConnection] = useState("");
  const [parentLayer, setParentLayer] = useState<any>(null);

  useEffect(() => {
    const fetchParentLayer = async () => {
      const parentId = searchParams.get('parent');
      if (parentId) {
        const { data } = await supabase
          .from('layers')
          .select('*')
          .eq('id', parentId)
          .single();
        
        if (data) setParentLayer(data);
      } else {
        // Default to The Verse Layer
        const { data } = await supabase
          .from('layers')
          .select('*')
          .eq('name', 'The Verse Layer')
          .single();
        
        if (data) setParentLayer(data);
      }
    };

    fetchParentLayer();
  }, [searchParams]);

  const handleSubmit = async () => {
    if (branchName && branchConcept && connection && parentLayer) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("You must be signed in to create a branch");
          navigate("/auth");
          return;
        }

        // Create the new layer
        const { data: newLayer, error: layerError } = await supabase
          .from('layers')
          .insert({
            name: branchName,
            creator_name: branchName,
            description: branchConcept,
            domain: connection,
            user_id: session.user.id
          })
          .select()
          .single();

        if (layerError) throw layerError;

        // Create the relationship
        const { error: relationError } = await supabase
          .from('layer_relationships')
          .insert({
            parent_layer_id: parentLayer.id,
            child_layer_id: newLayer.id
          });

        if (relationError) throw relationError;

        // Refresh stats
        const { error: refreshError } = await supabase.rpc('refresh_layer_stats');
        if (refreshError) console.error('Error refreshing stats:', refreshError);

        toast.success(`Branch created! ${parentLayer.creator_name} will earn points as your branch grows.`);
        navigate("/layer-tree");
      } catch (error) {
        console.error("Error creating branch:", error);
        toast.error("Failed to create branch. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-glow mb-8">
          Branch From The Verse Layer
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal space-y-6">
          <div className="text-foreground/90 text-lg leading-relaxed space-y-4">
            <p className="text-xl text-secondary font-semibold italic text-center">
              "Build upon the foundation laid by Pader Familias. Your branch will extend The Verse Layer 
              into new territories, and the creator will earn points as your world grows..."
            </p>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <Label htmlFor="branchName" className="text-lg font-semibold text-foreground">
                  What will you call your branch?
                </Label>
                <Input
                  id="branchName"
                  placeholder="e.g., The Quantum Expanse, Shadow Realm of Aethermoor..."
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="bg-muted/20 border-primary/30 text-lg"
                />
              </div>

              {branchName && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="connection" className="text-lg font-semibold text-foreground">
                    How does your branch connect to The Verse Layer?
                  </Label>
                  <Textarea
                    id="connection"
                    placeholder="e.g., A hidden fifth continent, a parallel dimension, a future timeline, an underground realm beneath Pyrothane..."
                    value={connection}
                    onChange={(e) => setConnection(e.target.value)}
                    className="bg-muted/20 border-primary/30 min-h-[100px] text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Explain how your world relates to or extends from the existing Verse Layer.
                  </p>
                </div>
              )}

              {connection && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="branchConcept" className="text-lg font-semibold text-foreground">
                    Describe your branch
                  </Label>
                  <Textarea
                    id="branchConcept"
                    placeholder="What makes your branch unique? Who inhabits it? What new powers, technologies, or philosophies exist here?"
                    value={branchConcept}
                    onChange={(e) => setBranchConcept(e.target.value)}
                    className="bg-muted/20 border-primary/30 min-h-[150px] text-lg"
                  />
                </div>
              )}
            </div>

            {branchName && connection && branchConcept && (
              <div className="pt-6 animate-fade-in">
                <Card className="p-6 bg-secondary/10 border-secondary/50">
                  <h3 className="text-2xl font-bold text-secondary mb-4">Your Branch</h3>
                  <div className="space-y-2 text-foreground/90">
                    <p><strong className="text-secondary">Parent Node:</strong> {parentLayer?.name || 'Loading...'} (by {parentLayer?.creator_name || 'Loading...'})</p>
                    <p><strong className="text-secondary">Branch Name:</strong> {branchName}</p>
                    <p><strong className="text-secondary">Connection:</strong> {connection}</p>
                    <p><strong className="text-secondary">Concept:</strong> {branchConcept}</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/explore-layers")}
          >
            Back
          </Button>
          {branchName && connection && branchConcept && (
            <Button 
              variant="divine" 
              size="lg"
              onClick={handleSubmit}
              className="animate-pulse-slow"
            >
              CREATE BRANCH
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchFromVerse;
