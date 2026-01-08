import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Users, 
  MapPin, 
  Gamepad2, 
  Shield, 
  Heart,
  Eye,
  EyeOff,
  Star,
  Globe,
  Sparkles
} from "lucide-react";

const GettingStarted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            Getting Started
          </h1>
          <p className="text-xl text-foreground/70">
            Your guide to mastering XCROL and taking control of your networks
          </p>
        </div>

        {/* Setting Up Your Profile */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Setting Up Your Profile</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>
              Your profile is your digital identity within XCROL. To get started:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li><strong>Sign up or log in</strong> using your email address</li>
              <li>Navigate to your <strong>Profile</strong> from the user menu</li>
              <li>Add a <strong>display name</strong> and <strong>avatar</strong> so friends can recognize you</li>
              <li>Write a <strong>bio</strong> that captures who you are</li>
              <li>Add your <strong>personal information</strong> like birthday, addresses, and nicknames</li>
              <li>Configure <strong>social links</strong> to connect your other platforms</li>
            </ol>
            <p className="text-primary/90 font-medium mt-4">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Pro tip: The more complete your profile, the more meaningful your connections become.
            </p>
          </div>
        </section>

        {/* Friendship Levels */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Understanding Friendship Levels</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              XCROL reimagines how we categorize relationships. Not all friends are equal, and that's okay. 
              Here are the friendship levels you can assign:
            </p>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
                <div>
                  <strong className="text-pink-500">Close Friend</strong>
                  <p className="text-sm">Your inner circle. These are the people you trust completely with your most personal information.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <strong className="text-yellow-500">Buddy</strong>
                  <p className="text-sm">Good friends you hang out with regularly. They get access to more than acquaintances.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <strong className="text-blue-500">Friendly Acquaintance</strong>
                  <p className="text-sm">People you know and like, but aren't super close with. Basic contact info is shared.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <EyeOff className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <strong className="text-purple-500">Secret Friend</strong>
                  <p className="text-sm">A close connection that's hidden from public view. For relationships you want to keep private.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <Eye className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <strong className="text-orange-500">Fake Friend</strong>
                  <p className="text-sm">Appears as a friend publicly, but has limited actual access. For social situations that require diplomacy.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Access Control */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Controlling Who Sees What</h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed">
            <p>
              Every piece of personal information you add can be assigned a visibility level:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Close Friend:</strong> Only your closest friends can see this</li>
              <li><strong>Buddy:</strong> Buddies and above can access</li>
              <li><strong>Friendly Acquaintance:</strong> All connected friends can view</li>
              <li><strong>Nobody:</strong> Hidden from everyone except you</li>
            </ul>
            <p className="mt-4">
              This applies to your birthday, home address, mailing address, nicknames, and social links. 
              You decide exactly what each level of friend can see about you.
            </p>
            <p className="text-primary/90 font-medium mt-4">
              <Shield className="w-4 h-4 inline mr-1" />
              Your data, your rules. XCROL puts you in complete control.
            </p>
          </div>
        </section>

        {/* Hometown */}
        <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Your Hometown Matters</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p className="text-lg">
              Setting your hometown isn't just about nostalgia—it's about <strong className="text-primary">building something bigger</strong>.
            </p>
            <p>
              When you pin your hometown on the IRL Layer map, you're joining a global network of real people in real places. 
              This isn't just a profile field; it's the foundation for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Local connections:</strong> Find others from your area or discover friends' roots</li>
              <li><strong>Travel networking:</strong> Planning a trip? See which friends have connections there</li>
              <li><strong>Community building:</strong> Be part of location-based features coming soon</li>
              <li><strong>Real-world meetups:</strong> Future functionality will help you organize and discover local gatherings</li>
            </ul>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mt-4">
              <p className="font-semibold text-primary flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Coming Soon
              </p>
              <p className="text-sm mt-2">
                Your hometown data will power exciting features including local event discovery, 
                travel buddy matching, and hometown pride leaderboards. Early adopters who set their 
                hometown now will be first to access these features.
              </p>
            </div>
          </div>
        </section>

        {/* Mini Games */}
        <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Playing the Mini Games</h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              The Adventure hub contains unique games that blend entertainment with the XCROL experience. 
              Access them from the <strong>ADVENTURE</strong> button on the Powers page.
            </p>
            
            <div className="grid gap-4 mt-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h3 className="font-bold text-lg mb-2">🌍 Every Country in the World</h3>
                <p className="text-sm">Help us get a user from every country! Invite friends and track global representation on your journey to connect the world.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h3 className="font-bold text-lg mb-2">💜 The Cure to Loneliness and Boredom</h3>
                <p className="text-sm">Wild, offbeat activities to cure boredom or connect with others. Get creative suggestions for making meaningful connections!</p>
              </div>
            </div>
            
            <p className="mt-4 text-primary/90 font-medium">
              <Gamepad2 className="w-4 h-4 inline mr-1" />
              Games open in responsive modals optimized for your device.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center space-y-6 py-8">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to Begin?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="divine" 
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Create Account
            </Button>
            <Button 
              variant="mystical" 
              size="lg"
              onClick={() => navigate("/powers")}
            >
              Explore Powers
            </Button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/powers")}
          >
            ← Back to Powers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
