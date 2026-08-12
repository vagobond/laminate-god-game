import {
  BookOpen,
  Castle,
  Home,
  Sparkles,
  Puzzle,
  Rss,
  Share2,
  MapPin,
  Lock,
} from "lucide-react";

export default function MoreFeaturesSections() {
  return (
    <>
      {/* Hearth Surf */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Home className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Hearth Surf — Hospitality Exchange</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            Hearth Surf (<code>/hearth-surfing</code>) is XCROL's hospitality hub. List your space, search for hosts,
            and manage incoming/outgoing requests in one place.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>My Space:</strong> Configure capacity, accommodation type, house rules and minimum friendship level.</li>
            <li><strong>Search:</strong> Find hosts by city, dates, and compensation type (free, chores, meals, cash, skill exchange).</li>
            <li><strong>Requests:</strong> Accept, decline, or negotiate hosting requests with built-in messaging.</li>
            <li><strong>References:</strong> Host and Guest references can be left after a stay — visible on the public profile to build trust.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Wayfarer+ (Friendly Acquaintance or above) is required to send a hosting request — hosts can raise the threshold further.
          </p>
        </div>
      </section>

      {/* Scrolls */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Your Scrolls — Bundle Your Writing</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            Scrolls (<code>/scrolls</code>) turn your XCROL writing into a personal archive — your own book-in-progress.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Bundle your <strong>Xcrol entries</strong> and your own <strong>group posts</strong> into a Scroll.</li>
            <li><strong>Auto-compile</strong> by date range, then reorder, label chapters, and add interludes.</li>
            <li>Add a title, subtitle, blurb, and cover image.</li>
            <li><strong>Export</strong> to Markdown, ePub, or print to PDF.</li>
            <li>Only your own first-party content is included — never anyone else's.</li>
          </ul>
        </div>
      </section>

      {/* Scroll AI */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Scroll AI — Optional Writing Assistant</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            Scroll AI is an optional writing assistant for your Scrolls — proofreading, chapter titles, blurbs, and
            light editing suggestions. It is strictly <strong>opt-in</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>Bring Your Own Key (BYOK):</strong> Paste an OpenRouter API key in <strong>Settings → AI Assistance</strong>.
              The key is stored only in your browser's IndexedDB — never on XCROL servers.</li>
            <li>No content is sent to any AI provider unless you click an assist action.</li>
            <li>Remove the key anytime to fully disable AI assistance.</li>
          </ul>
        </div>
      </section>

      {/* The Castle */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <Castle className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl md:text-3xl font-bold">The Castle — A Destination, Earned</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            The Castle is XCROL's upcoming library, accessible from the Powers page. Entry is earned through
            participation — points, friends, accepted invites, and quests not yet revealed.
          </p>
          <p>
            Inside, finished Scrolls can be published (ePub and PDF) for sale. The revenue split is
            <strong> 60% to the author, 40% to XCROL</strong>. Build your Scroll now; the gates open later.
          </p>
        </div>
      </section>

      {/* Profile Widgets & Integrations */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Puzzle className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Profile Widgets & Ecosystem Integrations</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            Drop lightweight widgets onto your profile to surface what you do across the open web — without leaving XCROL.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>Pixelfed photo feed</li>
            <li>PeerTube channel</li>
            <li>NOSTR latest notes</li>
            <li>RSS / Atom feed</li>
            <li>Generic embed for any other site that supports it</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Widgets are lazy-loaded iframes — they only render when a visitor reaches your profile, and respect your trust tiers.
          </p>
        </div>
      </section>

      {/* RSS Feeds */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Rss className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">RSS Feeds in The River</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            Add RSS / Atom feeds from <strong>Settings → RSS Feeds</strong>. Each new article appears in your own River
            alongside friends' Xcrols — chronological, no algorithm. RSS items are personal: only you see them.
          </p>
        </div>
      </section>

      {/* Federation */}
      <section className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <Share2 className="w-8 h-8 text-indigo-500" />
          <h2 className="text-2xl md:text-3xl font-bold">Federation — Beyond XCROL</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <p>
            XCROL is built to outlive itself. Your identity and public content can travel outside the platform:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>NOSTR:</strong> Auto-publish public Xcrol entries as kind 1 notes and bridge Brooks via NIP-17 DMs (opt-in).</li>
            <li><strong>NIP-05:</strong> Become discoverable as <code>handle@xcrol.com</code> on the NOSTR network.</li>
            <li><strong>ActivityPub:</strong> Planned — direct Mastodon/Fediverse following isn't live yet.</li>
            <li><strong>Rich link previews:</strong> Public XCROL posts and profiles render OpenGraph cards on Mastodon, Signal, iMessage, etc.</li>
            <li><strong>Data export:</strong> Download a JSON archive of everything XCROL stores about you (Settings → Download My Data).</li>
          </ul>
        </div>
      </section>

      {/* Hometown Rules */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Hometown Privacy & Cooldown</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>Approximate location:</strong> Hometown coordinates are rounded for privacy — pinned to a city, not a street.</li>
            <li><strong>90-day cooldown:</strong> Once set, you can change your hometown only every 90 days to keep the map honest.</li>
            <li><strong>Hometown timezone:</strong> Your daily Xcrol limit and post timestamps follow your hometown's timezone, not the server.</li>
          </ul>
        </div>
      </section>

      {/* Account & Auth */}
      <section className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Account & Authentication</h2>
        </div>
        <div className="space-y-3 text-foreground/80 leading-relaxed">
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li><strong>Email + password</strong> or <strong>Google sign-in</strong>. Email verification is required.</li>
            <li><strong>Invite codes</strong> are optional — anyone with a confirmed email can join. Invites still grant bonus points to both parties.</li>
            <li><strong>Password recovery:</strong> Use the "Forgot password" link on the sign-in screen at any time, even while logged in.</li>
            <li><strong>Content Policy:</strong> Must be acknowledged at signup. Read it at <code>/content-policy</code>.</li>
            <li><strong>Account deletion:</strong> Request permanent deletion from Settings → Delete Account. The request is processed by an admin.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
