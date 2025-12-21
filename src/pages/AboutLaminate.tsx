import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const AboutLaminate = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full animate-fade-in space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold text-center text-glow mb-8">
          What is XCROL?
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal">
          <div className="space-y-6 text-foreground/90 leading-relaxed">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary">
                XCROL — Take Control of Your Own Networks
              </h2>
              
              <p className="text-lg">
                XCROL is an ever-expanding, collaborative world-building engine where creators of all kinds—writers, 
                coders, filmmakers, musicians, designers, or anyone with a spark—craft modular "nodes" that stack, snap, 
                and fuse together into infinite realities. Every new creation becomes a layer in a vast, living lattice of 
                interconnected stories, systems, and worlds.
              </p>

              <div className="text-center py-4 space-y-2 text-xl font-semibold text-secondary italic">
                <p>In XCROL, imagination is not linear. It is stratified.</p>
                <p>Every idea becomes a module.</p>
                <p>Every module becomes a node.</p>
                <p>Every node becomes a layer.</p>
                <p>And every layer can spawn infinite new layers.</p>
              </div>
            </div>

            <div className="space-y-4 border-l-2 border-primary/50 pl-6">
              <h3 className="text-2xl font-bold text-primary">Core Concept</h3>
              <p>At its foundation, XCROL is a combinable, interoperable metaverse:</p>
              
              <ul className="space-y-2 list-none">
                <li><strong className="text-accent">Modular</strong> — Every contribution is a discrete component that plugs into others.</li>
                <li><strong className="text-accent">Multimedia</strong> — Story, code, art, video, audio, games, software systems—anything can be a node.</li>
                <li><strong className="text-accent">Collaborative</strong> — Anyone can build on anyone else&apos;s work.</li>
                <li><strong className="text-accent">Interoperable</strong> — Nodes obey universal structures so they can fit together, remix, extend, and evolve.</li>
                <li><strong className="text-accent">AI-Harmonized</strong> — The XCROL Engine uses AI to "smooth" the seams between modules, ensuring continuity, aesthetic cohesion, and functional interoperability across wildly different media and styles.</li>
              </ul>

              <p className="text-muted-foreground italic">
                Creators retain full ownership of their IP—but those who build on that IP gain full control over their own layers.
              </p>

              <div className="text-center py-2 space-y-1 text-lg font-medium text-secondary">
                <p>One seed can grow forests.</p>
                <p>One story can spawn galaxies.</p>
                <p>One line of code can become an entire platform.</p>
              </div>
            </div>

            <div className="space-y-4 border-l-2 border-secondary/50 pl-6">
              <h3 className="text-2xl font-bold text-secondary">The Layers</h3>
              <p>
                A layer is a unique pathway through XCROL—a branching reality grown from one or more existing nodes. 
                Every layer is a playable or explorable chain of creative modules.
              </p>
              
              <p>Because layers can branch infinitely, XCROL contains:</p>
              <ul className="space-y-1 list-disc list-inside pl-4">
                <li>fantasy worlds evolving into sci-fi futures</li>
                <li>platforms built inside stories</li>
                <li>games nested inside documentaries</li>
                <li>real-world ("IRL layer") projects linking back into fictional realms</li>
                <li>recursive timelines and parallel universes</li>
                <li>collaborative codebases spawning art projects spawning mythologies spawning apps</li>
              </ul>

              <div className="text-center py-2 text-lg font-medium text-primary">
                <p>Every path is a fractal universe.</p>
                <p>Every junction is a possibility.</p>
              </div>
            </div>

            <div className="space-y-4 bg-muted/20 p-6 rounded-lg border border-accent/30">
              <h3 className="text-2xl font-bold text-accent">Points & Ecosystem Growth</h3>
              <p>XCROL rewards creators who seed popular worlds or foundational modules.</p>
              
              <h4 className="text-xl font-semibold text-primary mt-4">Branch Points System:</h4>
              <ul className="space-y-2 list-disc list-inside pl-4">
                <li>When you create a node, you gain points for every direct branch created from it.</li>
                <li>If someone builds a branch off your branch (a "descendant layer"), you earn points again, no matter how far down the chain it occurs.</li>
                <li>Points compound through the lineage of creativity.</li>
              </ul>

              <div className="bg-card/40 p-4 rounded mt-4 space-y-2 text-sm">
                <p className="font-semibold text-secondary">Example:</p>
                <ul className="space-y-1 list-none pl-2">
                  <li>• Player CD creates a node.</li>
                  <li>• 100 players branch from it → CD +100 points</li>
                  <li>• Player JM builds one of those branches and gets 100 branches on their node.</li>
                  <li className="pl-4">→ JM gets +100 points</li>
                  <li className="pl-4">→ CD gets +100 more (because JM&apos;s node descends from CD&apos;s)</li>
                  <li>• Player EK branches from JM&apos;s node and earns 100 branches.</li>
                  <li className="pl-4">→ EK gets +100</li>
                  <li className="pl-4">→ JM gets +100</li>
                  <li className="pl-4">→ CD gets +100</li>
                  <li className="font-semibold text-primary">Everyone in the ancestry benefits.</li>
                </ul>
              </div>

              <p className="mt-4">Points unlock:</p>
              <ul className="space-y-1 list-disc list-inside pl-4">
                <li>New layers (pricing scales with complexity)</li>
                <li>Enhanced creation tools inside the engine</li>
                <li>The ability to "clone" entire layer-chains and launch them as brand-new starting nodes ("Genesis Trees")</li>
                <li>Special cosmetic and functional upgrades to your creator portal</li>
              </ul>

              <p className="text-secondary font-semibold italic mt-4">
                This creates a self-sustaining creative economy where every new idea enriches the whole system.
              </p>
            </div>

            <div className="space-y-4 border-l-2 border-primary/50 pl-6">
              <h3 className="text-2xl font-bold text-primary">The XCROL Engine</h3>
              <p>At the center is a modular AI harmonization engine that:</p>
              
              <ul className="space-y-1 list-disc list-inside pl-4">
                <li>understands how modules connect</li>
                <li>adapts storylines between layers</li>
                <li>balances continuity across large worlds</li>
                <li>converts mismatched media into compatible forms</li>
                <li>builds bridges between incompatible mechanics or aesthetics</li>
                <li>optimizes code and metadata for interoperability</li>
                <li>tags, maps, and visualizes the entire growing multiverse</li>
              </ul>

              <p className="mt-4 text-muted-foreground italic">
                It is a cross-media, cross-platform interpreter that ensures every node—from a paragraph to a short film 
                to a VR mini-game to a software library—can become part of the same living mesh.
              </p>
            </div>

            <div className="space-y-4 bg-primary/10 p-6 rounded-lg border border-primary/50 mt-6">
              <h3 className="text-2xl font-bold text-primary">The Vision</h3>
              <p>XCROL aims to be:</p>
              
              <ul className="space-y-2 list-disc list-inside pl-4">
                <li>the first open metaverse built from player contributions instead of corporate silos</li>
                <li>a place where creators keep their rights while enabling limitless remixing and transformation</li>
                <li>a playground where no medium is excluded</li>
                <li>a platform where stories, software, and worlds grow organically</li>
                <li>a living record of collaborative creation, layered together into something greater</li>
              </ul>

              <p className="text-xl font-bold text-center text-glow-gold mt-6">
                Worlds aren&apos;t just built—they&apos;re layered: infinite, overlapping, interoperable, and alive.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/powers")}
          >
            Back to Powers
          </Button>
          <Button 
            variant="divine" 
            size="lg"
            onClick={() => navigate("/pader-familias")}
          >
            Begin Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutLaminate;
