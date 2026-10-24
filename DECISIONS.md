# Ascent decisions

- 2026-10-24: Integrate at `/ascent/` in the existing Astro + TypeScript + Tailwind portfolio. This deliberately replaces the suggested Next.js stack: one static Cloudflare Pages build preserves the portfolio's deployment and theme. No account, analytics, API key, or server is required.
- Original lessons and problems are data, validated with Zod. Progress uses an IndexedDB adapter with JSON backup. SM-2 schedules reviews; mastery requires successes on separate dates.
- Python runs only in disposable Pyodide workers. Termination is the hard time limit. Report elapsed time; browser execution cannot reliably measure peak Python memory, so do not invent it.
- Static deployment cannot keep hidden tests secret. Separate files are fetched only on Submit; these are practice checks, not a secure assessment. A remote Runner is required for trusted hidden tests and resource isolation. User code can inspect its worker; do not use results for certification.
- Pyodide 0.29.5 is pinned after checking the official release notes on 2026-10-24. Initial Python use needs network and a runtime download. Offline lessons/progress work after the app has been cached; Python offline support is not promised.
- Lab profiles are editable study emphases, not verified predictions of a company's interview loop. Unverified formats are labeled. Readiness is a transparent practice heuristic, never an offer prediction.
- No optional model grader or API-key collection in this release. Free responses use self-assessment. Full remote PyTorch, recording, and long mock loops are explicitly future work.
