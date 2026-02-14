import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Link as LinkIcon, ExternalLink, Phone, Mail, MessageCircle } from "lucide-react";
import ConnectionDegreeBadge from "@/components/ConnectionDegreeBadge";
import type { PublicProfileData, FriendshipLevel } from "./usePublicProfileData";

interface ProfileInfoCardProps {
  profile: PublicProfileData;
  displayName: string;
  hometown: string | null;
  isOwnProfile: boolean;
  resolvedUserId: string;
  currentUserId: string | null;
  canSeeAcquaintanceFields: boolean;
  canSeeBuddyFields: boolean;
  canSeeCloseFriendFields: boolean;
}

export const ProfileInfoCard = ({
  profile,
  displayName,
  hometown,
  isOwnProfile,
  resolvedUserId,
  currentUserId,
  canSeeAcquaintanceFields,
  canSeeBuddyFields,
  canSeeCloseFriendFields,
}: ProfileInfoCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      {/* Header Banner */}
      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />

      <CardContent className="relative pt-0 pb-8">
        {/* Avatar */}
        <div className="flex justify-center -mt-12 mb-4">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg" key={profile.avatar_url}>
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} optimizeSize={256} />
            <AvatarFallback className="text-2xl">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and Connection Degree */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {!isOwnProfile && resolvedUserId && (
            <div className="mt-2 flex justify-center">
              <ConnectionDegreeBadge
                profileId={resolvedUserId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>

        {/* Hometown */}
        {hometown && (
          <button
            onClick={() => navigate("/irl-layer")}
            className="flex items-center justify-center gap-2 text-muted-foreground mb-4 hover:text-primary transition-colors cursor-pointer w-full"
          >
            <MapPin className="w-4 h-4" />
            <span className="hover:underline">{hometown}</span>
          </button>
        )}

        {/* Nicknames */}
        {profile.nicknames && (
          <p className="text-center text-muted-foreground italic">
            aka "{profile.nicknames}"
          </p>
        )}

        {/* Birthday */}
        {profile.birthday_month && profile.birthday_day && (
          <p className="text-center text-sm text-muted-foreground">
            🎂 {new Date(2000, profile.birthday_month - 1, profile.birthday_day).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            {profile.birthday_year && `, ${profile.birthday_year}`}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Public Link */}
        {profile.link && (
          <div className="mt-6 flex justify-center">
            <a
              href={profile.link.startsWith("http") ? profile.link : `https://${profile.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="truncate max-w-[200px]">
                {profile.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Friend-only Contact Info */}
        {(canSeeAcquaintanceFields || canSeeBuddyFields || canSeeCloseFriendFields) && (
          <div className="mt-6 space-y-3">
            {canSeeAcquaintanceFields && (profile.linkedin_url || profile.contact_email) && (
              <div className="p-4 bg-secondary/20 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact</p>
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {profile.contact_email && (
                  <a
                    href={`mailto:${profile.contact_email}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {profile.contact_email}
                  </a>
                )}
              </div>
            )}

            {canSeeBuddyFields && profile.instagram_url && (
              <div className="p-4 bg-secondary/20 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Social</p>
                <a
                  href={profile.instagram_url.startsWith("http") ? profile.instagram_url : `https://${profile.instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Instagram
                </a>
              </div>
            )}

            {canSeeCloseFriendFields && (profile.whatsapp || profile.phone_number || profile.private_email || profile.home_address || profile.mailing_address) && (
              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <p className="text-xs text-primary uppercase tracking-wide">Private Contact</p>
                {profile.home_address && (
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    🏠 {profile.home_address}
                  </p>
                )}
                {profile.mailing_address && (
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    📬 {profile.mailing_address}
                  </p>
                )}
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp: {profile.whatsapp}
                  </a>
                )}
                {profile.phone_number && (
                  <a
                    href={`tel:${profile.phone_number}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {profile.phone_number}
                  </a>
                )}
                {profile.private_email && (
                  <a
                    href={`mailto:${profile.private_email}`}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {profile.private_email}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
