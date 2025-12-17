import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";

const AudioMuteButton = () => {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("audio-muted") === "true";
  });

  useEffect(() => {
    localStorage.setItem("audio-muted", String(isMuted));
    window.dispatchEvent(new CustomEvent("audio-mute-changed", { detail: isMuted }));
  }, [isMuted]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsMuted(!isMuted)}
      className="h-9 w-9"
      title={isMuted ? "Unmute audio" : "Mute audio"}
    >
      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </Button>
  );
};

export default AudioMuteButton;
