import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is XCROL and how is it different from other social networks?",
    a: "XCROL is a private social network with no ads, no tracking, and no algorithms. Every piece of information you share is governed by friendship levels you define, and your content is shown chronologically. You own your data — export or delete it anytime.",
  },
  {
    q: "Do I need an invite to join?",
    a: "No. Invite codes are optional. Anyone with a confirmed email address can sign up. Invite codes still grant bonus points to both the inviter and the new member.",
  },
  {
    q: "Why can I only post once a day in The River?",
    a: "The 1-post-per-day, 240-character limit is intentional. It forces you to distill the day into its essence and keeps The River readable — no doomscrolling, no engagement bait.",
  },
  {
    q: "Why didn't my friend's post show up in The River?",
    a: "The River filters by friendship level. If a friend posted to 'Close Friends only' and you're set as a Buddy, you won't see it. Ask your friend to adjust the post's privacy or your friendship level if appropriate.",
  },
  {
    q: "What's the difference between The River and The Brook?",
    a: "The River is your shared friends' feed. A Brook is a private two-person stream — like a tiny River shared with only one other person. You can have up to 5 active Brooks, and Brook posts don't count against your daily Xcrol.",
  },
  {
    q: "What do the friendship levels actually do?",
    a: "Each level (Oath Bound, Blood Bound, Companion, Wayfarer, Invisible Ally, Shadow Friend) determines what profile fields, posts, and contact info that person can see. Wayfarer or above is the minimum for sending meetup/hosting requests and leaving references.",
  },
  {
    q: "Can I change someone's friendship level later?",
    a: "Yes, anytime, from The Forest or their profile. Changes take effect immediately and apply to all past and future content.",
  },
  {
    q: "How do I delete a Xcrol entry, Brook post, or group post?",
    a: "Open the post, use the menu (•••), and choose Delete. Replies and reactions are removed with it. Soft-deleted messages keep an audit trail for moderation but disappear from the UI.",
  },
  {
    q: "Why can I only change my hometown every 90 days?",
    a: "The IRL map's usefulness depends on stable locations. A 90-day cooldown prevents the map from becoming noise and keeps meetup/hosting search results meaningful.",
  },
  {
    q: "Is my exact home address visible on the map?",
    a: "No. Hometown coordinates are rounded for privacy — you're pinned to your city, not your street. Full home address is a separate profile field with its own visibility control.",
  },
  {
    q: "Can I change my username?",
    a: "Usernames are immutable once chosen. Pick something you'll be happy with long-term. Display names can be changed freely.",
  },
  {
    q: "How does 'Login with XCROL' work? Is it secure?",
    a: "XCROL is a standard OAuth 2.0 provider with PKCE. You choose exactly which scopes (profile, email, hometown, connections, xcrol entries) each app gets, and you can revoke access anytime from Settings → Connected Apps.",
  },
  {
    q: "How do points and The Castle work?",
    a: "Every meaningful action earns points — posting, inviting, hosting, getting references, etc. Points and other criteria (friends, accepted invites) unlock The Castle, where finished Scrolls can be published with a 60/40 author/platform revenue split.",
  },
  {
    q: "What is Scroll AI? Does it send my writing to OpenAI?",
    a: "Scroll AI is an optional writing assistant. It is BYOK — you paste your own OpenRouter API key, which lives only in your browser's IndexedDB. No content leaves your device unless you click an assist action, and nothing is sent to XCROL servers.",
  },
  {
    q: "Does XCROL work with Mastodon / NOSTR / the Fediverse?",
    a: "Partly. NOSTR is live: opt in via Settings → NOSTR Identity to auto-publish public posts and be discoverable as handle@xcrol.com (NIP-05). ActivityPub support — letting Mastodon users follow you directly — is planned but not live yet. Public post links shared on Mastodon, Signal, iMessage, etc. render rich previews.",
  },
  {
    q: "Can I install XCROL as an app on my phone?",
    a: <>Yes — XCROL is a Progressive Web App. Visit <code>/install-app</code> for step-by-step instructions on iOS and Android.</>,
  },
  {
    q: "How do I export or delete all my data?",
    a: "Settings → Download My Data exports a complete JSON archive (GDPR-compliant). Settings → Delete Account requests permanent deletion, processed by an admin.",
  },
  {
    q: "I forgot my password. What now?",
    a: "Click 'Forgot password' on the sign-in screen. You can trigger recovery even while logged in. The reset link arrives by email.",
  },
  {
    q: "Where do I report a bug, abusive content, or get help?",
    a: <>Use the Flag option on any post or reference to report content. For bugs and account issues, email <a href="mailto:hello@xcrol.com" className="text-primary hover:underline">hello@xcrol.com</a>.</>,
  },
];

export default function FaqSection() {
  return (
    <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50" id="faq">
      <div className="flex items-center gap-3">
        <HelpCircle className="w-8 h-8 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h2>
      </div>
      <p className="text-foreground/70">
        Short answers to the questions that come up most often.
      </p>
      <Accordion type="multiple" className="w-full">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-foreground/80 leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
