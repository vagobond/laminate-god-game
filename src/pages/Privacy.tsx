import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-4">Last updated: January 7, 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>When you use XCROL, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, display name, and password</li>
              <li><strong>Profile Information:</strong> Bio, avatar, hometown, birthday, contact details, and social links you choose to provide</li>
              <li><strong>Content:</strong> Posts, messages, reactions, and other content you create</li>
              <li><strong>Location Data:</strong> Hometown coordinates and meetup locations you share</li>
              <li><strong>Usage Data:</strong> How you interact with the Platform</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <h2 className="text-xl font-semibold text-amber-500">⚠️ IMPORTANT: Platform Risks</h2>
            <p className="font-semibold">
              You must understand and accept the following inherent risks:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Data Exposure:</strong> Any information you share on the Platform may be visible 
                to other users based on your privacy settings. Even with restrictive settings, no system 
                is perfectly secure.
              </li>
              <li>
                <strong>Third-Party Access:</strong> If you connect third-party applications via OAuth, 
                those applications will have access to your data according to the permissions you grant.
              </li>
              <li>
                <strong>User Interactions:</strong> We cannot verify the identity or intentions of other users. 
                Meeting people in real life carries inherent risks.
              </li>
              <li>
                <strong>Data Breaches:</strong> Despite our security measures, no internet-based platform 
                can guarantee complete security. Unauthorized parties may potentially access your data.
              </li>
              <li>
                <strong>Permanent Data:</strong> Once you share information publicly or with others, you cannot 
                fully control how it is used, copied, or distributed.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <h2 className="text-xl font-semibold text-destructive">⚠️ INTERNET RISKS</h2>
            <p className="font-semibold">
              By using any internet-connected service, including XCROL, you acknowledge:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>No Absolute Privacy:</strong> The internet is fundamentally not a private medium. 
                Data transmissions can potentially be intercepted.
              </li>
              <li>
                <strong>Metadata Collection:</strong> Your internet service provider, network operators, 
                and various intermediaries may collect information about your activity.
              </li>
              <li>
                <strong>Government Access:</strong> Law enforcement or government agencies may legally 
                compel disclosure of your data.
              </li>
              <li>
                <strong>Hacking & Phishing:</strong> Malicious actors constantly attempt to compromise 
                online accounts. Use strong, unique passwords.
              </li>
              <li>
                <strong>Permanent Digital Footprint:</strong> Information shared online may persist 
                indefinitely, even after deletion from the Platform.
              </li>
              <li>
                <strong>Location Tracking:</strong> Sharing location data reveals your physical whereabouts, 
                which carries inherent safety risks.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and operate the Platform</li>
              <li>Enable connections and communications between users</li>
              <li>Display your profile to other users according to your settings</li>
              <li>Send service-related notifications</li>
              <li>Improve and develop the Platform</li>
              <li>Enforce our Terms and Conditions</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p>Your information may be shared with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Other Users:</strong> Based on your friendship levels and privacy settings</li>
              <li><strong>Third-Party Apps:</strong> If you authorize them via OAuth</li>
              <li><strong>Service Providers:</strong> Who help us operate the Platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">4. Your Privacy Controls</h2>
            <p>You can control your privacy through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Friendship levels that determine what different friends can see</li>
              <li>Visibility settings for sensitive information like birthday, address, and phone</li>
              <li>Custom friendship types with granular permission controls</li>
              <li>Blocking users who you do not want to interact with</li>
              <li>Account deletion to remove your data</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. After account deletion, 
              some data may persist in backups or logs for a limited period. Content you shared 
              with others (messages, references) may remain visible to those users.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">6. Security</h2>
            <p>
              We implement reasonable security measures to protect your data. However, 
              <strong> we cannot guarantee absolute security</strong>. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using a strong, unique password</li>
              <li>Not sharing your login credentials</li>
              <li>Being cautious about phishing attempts</li>
              <li>Carefully considering what personal information you share</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">7. Children</h2>
            <p>
              The Platform is not intended for users under 18 years of age. We do not knowingly 
              collect information from children.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy at any time. Continued use of the Platform 
              constitutes acceptance of any changes.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">9. Your Responsibility</h2>
            <p className="font-semibold">
              YOU ARE SOLELY RESPONSIBLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deciding what information to share on the Platform</li>
              <li>Understanding and accepting the risks of sharing personal information online</li>
              <li>Configuring your privacy settings appropriately</li>
              <li>Any consequences arising from information you choose to share</li>
            </ul>
          </section>

          <div className="mt-12 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-semibold text-destructive">
              BY USING XCROL, YOU ACKNOWLEDGE THAT YOU UNDERSTAND THE RISKS INHERENT IN SHARING 
              PERSONAL INFORMATION ON THE INTERNET AND ACCEPT FULL RESPONSIBILITY FOR YOUR 
              PRIVACY CHOICES AND THEIR CONSEQUENCES.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;