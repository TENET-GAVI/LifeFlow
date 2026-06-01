Objective:
Continue designing the independent LifeFlow iPhone life-rhythm app project on the Desktop.

Status:
Prototype created. Ready for visual QA, iteration, or conversion to SwiftUI / React.

Changed:
- Added `prototype/index.html`, a standalone high-fidelity iPhone app prototype.
- Added PWA files in `prototype/`: `site.webmanifest`, `sw.js`, and `icon.svg`.
- Added `docs/phone-install.md` for installing the prototype to an iPhone home screen after HTTPS deployment.
- Updated `README.md` to point to the prototype and next steps.
- Existing product spec remains in `docs/product-design.md`.

Verified:
- Opened the prototype through a temporary localhost static server for browser QA.
- Confirmed the page title, Today screen, and bottom tabs render.
- Confirmed Habits tab switching works.
- Confirmed review bottom sheet opens and Save transitions to Trends.
- Fixed tab switching so the scroll container resets to top.
- Confirmed no browser console errors during QA.
- Confirmed PWA assets are present and were served successfully through localhost.

Key decisions:
- Keep all new LifeFlow work inside `C:\Users\ASUS\Desktop\LifeFlow`.
- Use a quiet life-control-console visual direction: paper background, ink text, mint primary state, sky/coral/gold/leaf status colors.
- Prototype includes Today, Habits, Review, and Trends tabs.
- Prototype includes habit completion toggles, progress updates, mood selection, and a review bottom sheet.
- Static HTML was chosen so the user can open the prototype without installing dependencies.
- PWA is the fastest path for standalone phone use; true native iOS still requires SwiftUI/Xcode.

Open issues:
- `docs/product-design.md` may appear garbled in some PowerShell output because of console encoding, but the intended document content is Chinese product design text.
- No SwiftUI project exists yet.
- iPhone standalone install needs an HTTPS hosted URL. LAN `http://192.168...` preview is only temporary and depends on the computer staying on.

Next steps:
1. Deploy `prototype/` to GitHub Pages, Netlify, Vercel, or Cloudflare Pages.
2. Open the HTTPS URL in iPhone Safari and use Share -> Add to Home Screen.
3. If converting to SwiftUI, create model types for Habit, DailyPlan, DailyReview, and TrendMetric.
