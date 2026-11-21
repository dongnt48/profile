# CV content and languages

Authoritative sources: `CV_NguyenThanhDong_Senior_Backend.html` (Vietnamese) and `CV_NguyenThanhDong_Senior_Backend_EN.html` (English). Both are supplied documents and are preserved unchanged by the content sync.

The profile defaults to English. EN / VI changes the displayed content, application names and project window titles. The choice is saved locally; storage failures do not prevent switching. The portfolio does not display a View CV action. The location is An Giang / Ho Chi Minh City in both supplied CVs and their extracted data.

## Content sources

- `src/data/cv/vi.json`: source paragraphs, skills, projects and experience extracted from the original CV, with whitespace normalized.
- `src/data/cv/en.json`: content extracted directly from the supplied English CV, with the same section and bullet order.
- `src/data/profile.ts`: selects the name, title, contact details, location, work arrangement and Profile/TikTok links extracted from each language's CV.
- `src/lib/i18n.ts`: interface translations (not additional professional claims).
- `src/data/projects.ts`: additional online projects supplied separately, including “Một Ngày Đi Chùa”. Its description and features reflect the public website; its preview is an actual screenshot. Frameworks and backend technologies are omitted when not provided.
- `public/cv/NguyenThanhDong-EN.html` and `public/cv/NguyenThanhDong-VI.html`: viewable/printable CVs.

The actual CV title is **Software Developer**. The filename is not used to infer a seniority level. Overlapping Innocom / FE Credit dates and approximate percentages are retained. The supplied names are **Nguyễn Thành Đông** (VI) and **Nguyen Thanh Dong** (EN). Project titles retain their R&D labels; technologies come from each project's Tech Stack / Công nghệ bullet. Portfolio and TikTok links appear in Contact. No demo or repository links are inferred.

Run `node scripts/extract-cv.mjs` after editing either source CV. It refreshes both JSON files and copies both source documents exactly into `public/cv/`. It handles `.job-block` and `.job-entry` experience sections and extracts project technologies separately from responsibilities. The extraction uses installed Chrome via Playwright and blocks network requests without translating or overwriting either supplied CV.
