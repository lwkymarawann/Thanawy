# What changed

## Security (do this first)
- `.env.example` had **real, live Upstash Redis credentials** committed to
  git history. Replaced with placeholders. **Rotate that token in your
  Upstash dashboard** — it's already public since the repo is public.
- Added a `.gitignore` (there wasn't one), so `.env.local` and friends
  can't leak the same way again.

## Mobile UI — full rework
- Added the missing `viewport` meta tag. Before this, mobile browsers
  rendered the whole desktop layout zoomed out — this was the #1 mobile
  bug.
- Sidebar nav is now a bottom tab bar + slim top bar on screens under
  860px, with safe-area padding for notched phones.
- All the data tables (grades, schedule, calendar day view, subjects)
  now collapse into labeled stacked cards on mobile instead of
  horizontally-squished rows.
- 44px+ touch targets, 16px input font (stops iOS auto-zoom on focus),
  single-column forms on small screens.
- Swipe left/right on the calendar to change months.

## Colors
- New palette: indigo/violet primary, warm coral accent, refined
  semantic colors for grade badges, better contrast throughout.
- Full dark mode — auto-detects system preference, manual toggle
  (sun/moon icon), persisted across visits, no flash-of-wrong-theme on
  load.

## New features
- **Today widget** on the Calendar tab — today's classes + the next
  upcoming exam at a glance.
- **Grade stats** — overall average, strongest subject, subject that
  needs attention, at the top of the Grades tab.
- **Countdown chips** on upcoming exams ("Today", "Tomorrow", "In 3d").
- **Search** to filter subjects on the Grades tab.
- **Toast notifications** for save success/failure (the CSS for this
  existed before but was never wired up).
- Local JSON-file storage fallback for `npm run dev` — the README
  already promised this, but the code only ever talked to Upstash, so
  local dev without cloud credentials would just crash.

## Bug fix
- The role picker on the login screen (Me / Girlfriend / Mom) was
  rendering as an empty `<div>` — the buttons existed in CSS but were
  never added to the JSX. Restored.

## Files touched
`app/layout.js`, `app/globals.css`, `app/page.js`,
`components/DashboardClient.js`, `components/Icons.js` (new),
`lib/kv.js`, `lib/grading.js`, `.env.example`, `.gitignore` (new)

## How to apply
1. Unzip this over your local clone of the repo (or just replace the
   files listed above).
2. `git add -A && git commit -m "Mobile UI overhaul, dark mode, new features, security fix"`
3. `git push`
4. In Vercel (or wherever it's hosted), no env var changes are needed
   unless you rotate the Upstash token — then update it there too.
