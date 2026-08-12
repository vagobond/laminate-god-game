import { Search, Users, Home, Tag, Wrench, Briefcase, type LucideIcon } from "lucide-react";
import { TOWN_CATEGORIES } from "./townCategories";
import { toast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  community: Users,
  housing: Home,
  "for-sale": Tag,
  services: Wrench,
  jobs: Briefcase,
};

interface TownHomepageProps {
  isAuthenticated: boolean;
  onSelectCategory: (catKey: string) => void;
  onSelectSubcategory: (catKey: string, subKey: string) => void;
  onPostClick: () => void;
  onMyListingsClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
}

const TownHomepage = ({
  isAuthenticated,
  onSelectCategory,
  onSelectSubcategory,
  onPostClick,
  onMyListingsClick,
  searchQuery,
  onSearchChange,
  onSearch,
}: TownHomepageProps) => {
  const handleAuthAction = (action: () => void) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to use this feature.", variant: "destructive" });
      return;
    }
    action();
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-2 items-center border border-border rounded p-2 bg-card/50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search Xcrol Marketplace"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={onSearch}
          className="text-primary hover:text-primary/80"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Action links */}
      <div className="flex gap-4 text-sm">
        <button
          onClick={() => handleAuthAction(onPostClick)}
          className="text-primary hover:underline font-medium"
        >
          Post to Marketplace
        </button>
        <button
          onClick={() => handleAuthAction(onMyListingsClick)}
          className="text-primary hover:underline font-medium"
        >
          My Listings
        </button>
      </div>

      {/* Category grid — themed cards, link-list homage inside each */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border pt-4">
        {TOWN_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.key] ?? Tag;
          return (
            <div key={cat.key} className="rounded-lg border border-border/60 bg-card/50 p-4">
              <h3
                className="flex items-center gap-2 font-bold text-primary cursor-pointer hover:underline text-sm uppercase tracking-wider mb-2"
                onClick={() => onSelectCategory(cat.key)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {cat.label}
              </h3>
              <ul className="space-y-0">
                {cat.subcategories.map((sub) => (
                  <li key={sub.key}>
                    <button
                      onClick={() => onSelectSubcategory(cat.key, sub.key)}
                      className="text-sm text-foreground/80 hover:text-primary hover:underline transition-colors text-left"
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TownHomepage;
