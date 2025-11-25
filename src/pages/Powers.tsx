import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Powers = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-16 animate-fade-in max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-glow">
            Your Divine Powers Await
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            As a newly appointed deity, you hold the power to shape reality itself. 
            What will you do with this cosmic gift?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            variant="mystical" 
            size="xl"
            onClick={() => navigate("/creation-hub")}
            className="w-full sm:w-auto min-w-[250px]"
          >
            ENTER THE LAMINATE
          </Button>
          
          <Button 
            variant="mystical" 
            size="xl"
            onClick={() => navigate("/about-laminate")}
            className="w-full sm:w-auto min-w-[250px]"
          >
            WHAT IS THE LAMINATE?
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Powers;
