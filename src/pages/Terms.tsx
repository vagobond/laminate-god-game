import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-4">Last updated: January 7, 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using XCROL ("the Platform"), you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions. If you do not agree to these terms, 
              do not use the Platform.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">2. User Responsibility</h2>
            <p>
              <strong>You assume full and complete responsibility for:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All content you post, share, or transmit through the Platform</li>
              <li>All interactions with other users, whether online or in person</li>
              <li>Your own safety and security when meeting other users in real life</li>
              <li>Any decisions you make based on information obtained through the Platform</li>
              <li>Protecting your own account credentials and personal information</li>
              <li>Any consequences arising from your use of the Platform, whether intended or unintended</li>
              <li>Compliance with all applicable local, state, national, and international laws</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">3. No Warranties</h2>
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, 
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Platform will be uninterrupted, secure, or error-free</li>
              <li>Any information provided by other users is accurate, complete, or truthful</li>
              <li>Other users are who they claim to be</li>
              <li>The Platform is suitable for any particular purpose</li>
              <li>Any bugs or errors will be corrected</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, XCROL AND ITS OPERATORS, AFFILIATES, OFFICERS, 
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Direct, indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, goodwill, or other intangible losses</li>
              <li>Damages resulting from your interactions with other users</li>
              <li>Personal injury or property damage arising from your use of the Platform</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Any conduct of third parties on the Platform</li>
            </ul>
            <p className="font-semibold mt-4">
              YOU USE THIS PLATFORM ENTIRELY AT YOUR OWN RISK.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Use the Platform for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Scrape, harvest, or collect user data without consent</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">6. Content Ownership</h2>
            <p>
              You retain ownership of content you create and share. However, by posting content on the Platform, 
              you grant XCROL a non-exclusive, worldwide, royalty-free license to use, display, and distribute 
              your content in connection with operating the Platform.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">7. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, for any reason, 
              without notice or liability. You may also delete your account at any time.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless XCROL and its operators from any claims, 
              damages, losses, or expenses (including legal fees) arising from your use of the Platform, 
              your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Platform after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold">11. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              shall continue in full force and effect.
            </p>
          </section>

          <div className="mt-12 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-semibold text-destructive">
              BY USING XCROL, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS, UNDERSTAND THEM, 
              AND AGREE TO BE BOUND BY THEM. YOU ACCEPT FULL RESPONSIBILITY FOR YOUR USE OF THE 
              PLATFORM AND ANY CONSEQUENCES THAT MAY ARISE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;