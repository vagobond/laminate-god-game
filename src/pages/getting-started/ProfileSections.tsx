import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Users,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function ProfileSections() {
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);

  return (
    <>
      {/* Quick Start */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Setting Up Your Profile</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>Your profile is your digital identity within XCROL. Get started quickly:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Sign up</strong> using your email address</li>
            <li>Add a <strong>display name</strong> and <strong>avatar</strong></li>
            <li>Set your <strong>hometown</strong> on the IRL Layer map</li>
            <li>Configure <strong>friendship levels</strong> for your connections</li>
          </ol>
          <p className="text-primary/90 font-medium mt-4">
            <Sparkles className="w-4 h-4 inline mr-1" />
            The more complete your profile, the more meaningful your connections become.
          </p>
        </div>

        <Collapsible open={profileDetailsOpen} onOpenChange={setProfileDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start mt-4 text-primary hover:text-primary/80">
              {profileDetailsOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              {profileDetailsOpen ? "Hide detailed profile guide" : "Learn more about profile setup and features →"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
            <h3 className="font-bold text-lg">Complete Profile Guide</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary">Basic Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>Display Name:</strong> How friends see you (can be your real name or nickname)</li>
                  <li><strong>Username:</strong> Your unique @handle for shareable profile links</li>
                  <li><strong>Avatar:</strong> Upload a photo (max 2MB) so friends recognize you</li>
                  <li><strong>Bio:</strong> Tell your story in up to 1000 characters</li>
                  <li><strong>Public Link:</strong> Share a website, portfolio, or social link visible to everyone</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary">Personal Information (with Visibility Controls)</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>Birthday:</strong> Separate controls for day/month vs. birth year visibility</li>
                  <li><strong>Home Address:</strong> Your current residence (only share with trusted friends)</li>
                  <li><strong>Mailing Address:</strong> Where to receive mail (useful for postcards from traveling friends!)</li>
                  <li><strong>Nicknames:</strong> What close friends call you</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary">Contact Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>WhatsApp:</strong> For quick messaging (visible based on friendship level)</li>
                  <li><strong>Phone Number:</strong> Direct contact for close friends</li>
                  <li><strong>Private Email:</strong> Personal email for close connections</li>
                  <li><strong>Contact Email:</strong> General contact email</li>
                  <li><strong>Instagram & LinkedIn:</strong> Social media links</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary">Social Links</h4>
                <p className="text-sm ml-4">Add unlimited social links (Twitter, TikTok, YouTube, etc.) with individual visibility controls for each friendship level.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary">Custom Friendship Types</h4>
                <p className="text-sm ml-4">Create custom categories beyond the defaults (e.g., "Work Colleagues", "Travel Buddies") with granular control over what each type can see.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary">Profile Completeness</h4>
                <p className="text-sm ml-4">Your profile page shows a completeness indicator—the more you fill in, the richer your experience and connections become.</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
            Each level determines what information that person can see about you.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
              <div>
                <strong className="text-pink-500">Oath Bound (Close Friend)</strong>
                <p className="text-sm">Your inner circle. Complete access to all your information, including home address, birth year, and private contact details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Users className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <strong className="text-orange-500">Blood Bound (Family)</strong>
                <p className="text-sm">An independent category outside the trust hierarchy. Family members get phone number, private email, and full birthday—but not social links or other friend-tier info unless you choose to share.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <strong className="text-yellow-500">Companion (Buddy)</strong>
                <p className="text-sm">Good friends you hang out with regularly. Access to birthday (without year), mailing address, and most contact info.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <UserCheck className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <strong className="text-blue-500">Wayfarer (Friendly Acquaintance)</strong>
                <p className="text-sm">People you know and like, but aren't super close with. Basic contact info and public details. <strong>Wayfarer or above</strong> is the minimum tier required to send meetup/hosting requests and leave references.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <EyeOff className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <strong className="text-purple-500">Invisible Ally (Secret Friend)</strong>
                <p className="text-sm">A close connection hidden from public view. Same access as Oath Bound, but the relationship isn't visible to others.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Eye className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <strong className="text-red-500">Shadow Friend (Secret Enemy)</strong>
                <p className="text-sm">Appears as a friend publicly, but has minimal actual access. For social situations requiring diplomacy. You can optionally give them decoy information.</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Connection Degrees:</strong> XCROL also shows you how you're connected to people you haven't friended yet—friend-of-a-friend chains up to 3 degrees.
          </p>
        </div>
      </section>

      {/* Access Control */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Controlling Who Sees What</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>Every piece of personal information you add can be assigned a visibility level:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Close Friend:</strong> Only your closest friends can see this</li>
            <li><strong>Family:</strong> Family members (phone, email, full birthday by default)</li>
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
    </>
  );
}
