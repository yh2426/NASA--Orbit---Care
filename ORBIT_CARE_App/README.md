# ORBIT CARE

A mobile-first wellbeing web app concept for life away from Earth. Deep blue-gray surfaces, soft sage actions, and four gentle emotion colors.

## Open the demo

Open `index.html` in a modern browser. Keep `app.js`, `styles.css`, and `colors.css` in the same folder. No installation, dependencies, build step, API key, or backend is required.

For consistent browser storage, use the published site or serve the folder with any static web server. Local-file storage behavior depends on the browser. The standalone preview and published site have separate saved data.

## Working flows

- Check-in: choose from 24 emotions → optional reasons and note → review → save → Home or Support.
- History: seven-day overview, saved check-in list, and individual entry details.
- Wellbeing prompt: fictional sleep and resting-heart-rate changes → check in or dismiss.
- Common Room: sample crew posts, local support reactions, and locally saved posts.
- Haven: one-minute guided breathing with pause/resume; private reflection composer and saved reflections.
- Tether: contact list, sample incoming messages, and locally queued outgoing messages.
- Suggestions: saved check-in to rule-based support recommendations, with a direct route to breathing, Tether, Common Room, or reflection. No AI API is connected; free-text notes are not analyzed.
- About: demo and storage boundaries.

Seventeen route types and states extend the original eight-screen low-fi. Browser back/forward navigation is supported. The app works on mobile and desktop.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App entry point |
| `app.js` | Screens, interactions, and local persistence |
| `styles.css` | Responsive layout and component styling |
| `colors.css` | Shared approved color values |

Existing `lowfi.html` and `color-palette.html` can stay in the repository as design references.

## GitHub Pages

Upload these files into the repository root, with `index.html` at the same level as README.md. Then use **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/(root)**, and save. Use the live URL GitHub reports after deployment finishes.

Documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Data and demo boundaries

Health readings, crew profiles, contacts, and incoming messages are fictional. Nothing is transmitted: messages marked “queued” are only stored on the current browser. There is no authentication, real crew chat, wearable connection, or medical diagnosis. Reflections and entries use unencrypted browser localStorage. Avoid entering sensitive information in this prototype.

Saved data stays under the key `orbit-care-demo-v1`; clearing site data removes it. Each browser/origin has separate storage. If browser storage is unavailable, the app retains changes only in memory for the current tab and displays a notice. Unsaved check-ins are drafts and do not survive reloads. Breathing sessions stop when leaving their screen.

## Validation

Checked in Edge with browser automation: 24 emotion choices, full check-in flow, entry/history persistence, safe display of user-entered text, dismissed prompt persistence, local crew posts and reactions, reflections, local message queue, breathing phase timing/pause/completion, route rendering at 320/390/768/1440 px, and long-input wrapping. No page script errors occurred. Mobile and desktop screenshots were inspected.

Real phone testing, multi-user services, actual Figma import, and live deployment are not part of this local build.

