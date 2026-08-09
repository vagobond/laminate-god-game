# XCROL

**Not Being Used to Control You**

XCROL is a private social network. No spying. No ads. No algorithms. Just real people building real connections with full control over their digital identity.

---

## What is XCROL?

XCROL reimagines social networking by putting privacy and user control first. Every piece of information you share is governed by friendship levels you define. Your data belongs to you—not a platform.

---

## Core Features

### 🧑 Profile & Friendship Levels

Your profile is your digital identity within XCROL. Not all friends are equal, and XCROL respects that with a tiered friendship system:

| Level | What They See |
|-------|--------------|
| **Close Friend** | Full access: home address, birth year, private contacts |
| **Family** | Independent category: phone, private email, full birthday |
| **Buddy** | Birthday (no year), mailing address, most contacts |
| **Friendly Acquaintance** | Basic contact info and public details |
| **Secret Friend** | Same as Close Friend, but hidden from public view |
| **Secret Enemy** | Appears as a friend publicly, but has minimal real access |

You can also create **custom friendship types** (e.g., "Work Colleagues", "Travel Buddies") with granular visibility controls.

**Connection Degrees**: See how you're connected to non-friends via friend-of-a-friend chains up to 6 degrees.

---

### 📜 My Xcrol — Your Daily Diary

A personal micro-journal limited to **one entry per day** and **240 characters**. Each entry can include an optional link.

**Privacy levels per entry:**
- Private (only you)
- Close Friends only
- Buddies & above
- Acquaintances & above

---

### 🌊 The River — Friends' Feed

A chronological stream of Xcrol entries from your friends. No algorithm—just time-ordered updates (sorted by true UTC creation time, so posts always appear in the order they were actually written, regardless of the poster's timezone) filtered by friendship level. React with emoji and reply to entries. Optional RSS feed integration lets you pipe external blogs into your private feed.

---

### 💧 The Brook — Private Two-Person Streams

A dedicated space where exactly two people share daily updates with each other.

- Up to **5 active Brooks** per user
- **One post per day** per Brook (doesn't count as your daily Xcrol)
- 240-character posts with optional links
- Reactions and comments visible only to participants
- Configurable inactivity handling (rest, archive, or gentle nudge)
- **Fully private**: no public indicators, no streaks, no read receipts

---

### 🏘️ The Village — Community Groups

Community hubs where people with shared interests gather, post updates, and organize.

- Create groups with custom name, description, and slug (`/group/your-name`)
- Invite + Request membership model
- Admin controls for membership, settings, and content
- Trust-level-based content visibility

---

### 🏪 The Town — Community Marketplace

A classifieds board inspired by early-2000s Craigslist, built for trust-based communities.

**Categories**: Community · Housing · For Sale · Services & Jobs

- Browse listings without an account
- Post with custom contact info or direct XCROL messaging
- Search across titles and descriptions
- Manage your own listings

---

### 🌍 The World — IRL Map & Meetups

An interactive map showing where XCROL users call home.

- **Claim your hometown** by clicking on the map
- Discover connections in your area
- **Create meetups** with location, time, and description
- **Hosting requests**: Offer a spare room or request a stay when visiting friends
- Both meetups and hosting respect minimum friendship levels

Purple dots = users · Yellow dots = locations with active meetups

---

### 🔑 Login with XCROL — Portable Identity

XCROL is an **OAuth 2.0 identity provider** with PKCE support. Other websites can offer "Login with XCROL" just like Google or GitHub login.

**Available scopes:**
- `profile:read` — Basic profile info
- `profile:email` — Email address
- `hometown:read` — Hometown location
- `connections:read` — Friends list
- `xcrol:read` — Diary entries

You control which apps get access and can revoke permissions anytime from Settings → Connected Apps.

**For developers**: Go to Settings → Developer to create an OAuth app with your redirect URIs, then integrate using standard OAuth 2.0.

---

### 🌐 Decentralized Media

XCROL integrates with **Pixelfed** (photo hosting) and **PeerTube** (video hosting) for federated, censorship-resistant media that you own.

---

### ✅ References & Trust

Build trust through testimonials from friends:
- **Host** / **Guest** / **Friendly** / **Business** references
- Only friends at the appropriate level can leave references
- References can be flagged if inappropriate

---

### 💬 Messaging & Introductions

- **Direct Messages** with optional platform suggestions (WhatsApp, email, etc.)
- **Introduction Requests**: Ask a mutual friend to introduce you to someone
- XCROL bridges you to the right platform rather than replacing existing tools

---

### 🎮 The Adventure Hub

- **Every Country in the World**: Invite friends from different countries toward global representation
- **The Cure to Loneliness and Boredom**: AI-powered adventure game with creative suggestions
- **Dream Trip**: Plan an imaginary journey with AI assistance

---

### 📖 Your Scrolls — Bundle Your Writing

Turn your XCROL content into a personal archive — your own book-in-progress.

- Bundle your **Xcrol entries** and your own **group posts** into a Scroll
- **Auto-compile** by date range, then reorder, label chapters, and add interludes
- Add a title, subtitle, blurb, and cover
- **Export** to Markdown or print to PDF — take it to ChatGPT/Claude to polish into a publishable book
- Only your own first-party content is included — never anyone else's

**Coming soon — The Castle**: a library where you'll be able to publish finished Scrolls (ePub, PDF) for sale. Revenue split: **60% to you, 40% to XCROL**. Build your Scroll now; the gates open later.

---

## Earning Points

| Action | Points |
|--------|--------|
| Write a daily Xcrol entry | +1 |
| Include a link in your Xcrol | +1 |
| React or comment on a Xcrol | +1 |
| Each friend you have | +1 |
| Post in a group | +1 |
| Create a listing in The Town | +1 |
| Set up your hometown | +2 |
| Invite a friend | +2 |
| Start a Brook | +2 |
| Leave a review | +3 |
| Invited friend accepts | +5 |
| Keep a Brook alive for 5 days | +5 |
| Complete your full profile | +10 |
| Create a group in The Village | +10 |

> **The Castle**: Points are being counted. When the gates of The Castle finally open, those who have built something here will find the threshold more welcoming. More will be revealed in time.

---

## Quick Navigation

| Section | What's There |
|---------|-------------|
| **THE WORLD** | IRL map, meetups, hometown claims, Hearth Surf |
| **THE RIVER** | Friends' Xcrol feed, reactions, replies |
| **THE VILLAGE** | Community groups, posts, member management |
| **THE TOWN** | Marketplace, classifieds, listings |
| **YOU** | Profile, friends, settings, Xcrol diary, Brooks |

---

## Settings & Account

- **Notifications**: Email and in-app preferences
- **Privacy**: Online status, friend request settings
- **Blocked Users**: Manage blocks
- **Connected Apps**: OAuth apps with access to your data
- **Developer**: Create OAuth apps for "Login with XCROL"
- **Delete Account**: Request permanent deletion

---

## Development

### Quick Start

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

### Tech Stack

- [Vite](https://vitejs.dev/) — Build tool
- [React 18](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [shadcn/ui](https://ui.shadcn.com/) — Component library

### Deployment

- **Frontend:** `npm run deploy` builds the app and publishes it to the Cloudflare Worker serving `xcrol.com` (requires `CLOUDFLARE_API_TOKEN`; config in `wrangler.jsonc`).
- **Backend:** merging changes under `supabase/**` to `main` triggers `.github/workflows/backend-deploy.yml`, which applies migrations and deploys edge functions to the Supabase project.

See `docs/RUNBOOK.md` for full operational detail.
