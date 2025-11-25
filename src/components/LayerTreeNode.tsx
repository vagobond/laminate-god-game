import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface LayerNode {
  id: string;
  name: string;
  creator: string;
  branches: number;
  points: number;
  children?: LayerNode[];
}

interface LayerTreeNodeProps {
  node: LayerNode;
  level: number;
  onNodeClick: (node: LayerNode) => void;
}

export const LayerTreeNode = ({ node, level, onNodeClick }: LayerTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 p-1 hover:bg-primary/20 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-primary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary" />
            )}
          </button>
        )}
        
        <Card
          className={`flex-1 p-4 bg-card/60 backdrop-blur-sm border-primary/30 hover:border-primary/60 transition-all cursor-pointer mystical-glow ${
            level === 0 ? "border-2 border-primary" : ""
          }`}
          onClick={() => onNodeClick(node)}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary">{node.name}</h3>
                <p className="text-sm text-muted-foreground">by {node.creator}</p>
              </div>
              {level === 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Root Node
                </Badge>
              )}
            </div>
            
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Branches:</span>
                <span className="font-semibold text-secondary">{node.branches}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Points:</span>
                <span className="font-semibold text-accent">{node.points}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-2 pl-6 border-l-2 border-primary/30 space-y-2">
          {node.children!.map((child) => (
            <LayerTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
