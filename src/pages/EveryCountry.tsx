import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EveryCountryGame } from "@/components/EveryCountryGame";
import { ArrowLeft } from "lucide-react";

const EveryCountry = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/irl-layer")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-glow">
              Every Person in the World
            </h1>
            <p className="text-foreground/80 mt-1">
              Help us get a user from every country
            </p>
          </div>
        </div>

        <EveryCountryGame />
      </div>
    </div>
  );
};

export default EveryCountry;
