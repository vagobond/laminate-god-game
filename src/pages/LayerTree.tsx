import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LayerTreeNode, LayerNode } from "@/components/LayerTreeNode";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LayerTree = () => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<LayerNode | null>(null);
  const [treeData, setTreeData] = useState<LayerNode | null>(null);

  const { data: layers } = useQuery({
    queryKey: ['layers-tree'],
    queryFn: async () => {
      const { data: layersData, error: layersError } = await supabase
        .from('layers')
        .select('*');
      
      if (layersError) throw layersError;

      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('layer_relationships')
        .select('*');
      
      if (relationshipsError) throw relationshipsError;

      return { layers: layersData, relationships: relationshipsData };
    }
  });

  useEffect(() => {
    if (!layers) return;

    const buildTree = (parentId: string | null = null): LayerNode[] => {
      const children: LayerNode[] = [];
      
      layers.relationships
        .filter(rel => rel.parent_layer_id === parentId)
        .forEach(rel => {
          const layer = layers.layers.find(l => l.id === rel.child_layer_id);
          if (layer) {
            children.push({
              id: layer.id,
              name: layer.name,
              creator: layer.creator_name,
              branches: layer.branches_count,
              points: layer.total_points,
              children: buildTree(layer.id)
            });
          }
        });
      
      return children;
    };

    // Find root nodes (layers with no parent)
    const rootLayerIds = layers.layers
      .filter(layer => !layers.relationships.some(rel => rel.child_layer_id === layer.id))
      .map(layer => layer.id);

    if (rootLayerIds.length > 0) {
      const rootLayer = layers.layers.find(l => l.id === rootLayerIds[0]);
      if (rootLayer) {
        setTreeData({
          id: rootLayer.id,
          name: rootLayer.name,
          creator: rootLayer.creator_name,
          branches: rootLayer.branches_count,
          points: rootLayer.total_points,
          children: buildTree(rootLayer.id)
        });
      }
    }
  }, [layers]);

  const handleNodeClick = (node: LayerNode) => {
    setSelectedNode(node);
  };

  const calculateTotalPoints = (node: LayerNode): number => {
    let total = node.points;
    if (node.children) {
      node.children.forEach(child => {
        total += calculateTotalPoints(child);
      });
    }
    return total;
  };

  const totalTreePoints = treeData ? calculateTotalPoints(treeData) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            Layer Lineage Tree
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Explore the branching multiverse of The Laminate. Every node spawns new realities.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-primary/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-primary">Branch Structure</h2>
                  <Badge variant="secondary" className="text-sm">
                    Total Points: {totalTreePoints}
                  </Badge>
                </div>
                
                {treeData ? (
                  <div className="space-y-3">
                    <LayerTreeNode
                      node={treeData}
                      level={0}
                      onNodeClick={handleNodeClick}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading layer tree...
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-secondary/30 mystical-glow-teal">
              <h3 className="text-xl font-bold text-secondary mb-4">How Points Work</h3>
              <div className="space-y-3 text-sm text-foreground/80">
                <p>
                  <strong className="text-primary">Direct Branch:</strong> When someone branches from your node, you earn points.
                </p>
                <p>
                  <strong className="text-primary">Descendant Growth:</strong> When branches grow from your branches (grandchildren, great-grandchildren, etc.), you earn points from all descendants.
                </p>
                <p>
                  <strong className="text-primary">Compound Effect:</strong> The deeper the tree grows from your node, the more points you accumulate.
                </p>
                <div className="pt-2 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground italic">
                    The deeper your tree grows, the more points you accumulate from all descendants.
                  </p>
                </div>
              </div>
            </Card>

            {selectedNode && (
              <Card className="p-6 bg-card/60 backdrop-blur-sm border-primary/50 mystical-glow animate-fade-in">
                <h3 className="text-xl font-bold text-primary mb-4">Selected Layer</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-lg font-semibold">{selectedNode.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Creator</p>
                    <p className="text-lg font-semibold">{selectedNode.creator}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Direct Branches</p>
                      <p className="text-2xl font-bold text-secondary">{selectedNode.branches}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Points Earned</p>
                      <p className="text-2xl font-bold text-accent">{selectedNode.points}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      variant="divine" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate("/explore-layers")}
                    >
                      Explore This Layer
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <h3 className="text-lg font-bold text-primary mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20"></div>
                  <span>Root Node (Genesis Layer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-primary/30 bg-card/60"></div>
                  <span>Branch Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-primary/30"></div>
                  <span>Branch Connection</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/explore-layers")}
          >
            Back to Exploration
          </Button>
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/create-layer")}
          >
            Create Your Layer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayerTree;
