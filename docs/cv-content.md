# CV content and languages

Source: `CV_NguyenThanhDong_Senior_Backend.html` (Vietnamese, unchanged).
English translation: `CV_NguyenThanhDong_Senior_Backend_EN.html`.

The profile defaults to English. EN / VI changes the displayed content, application names, project window titles and CV link. The choice is saved locally; storage failures do not prevent switching.

## Content sources

- `src/data/cv/vi.json`: source paragraphs, skills, projects and experience extracted from the original CV, with whitespace normalized.
- `src/data/cv/en.json`: corresponding English translation, with the same section and bullet order.
- `src/data/profile.ts`: name, title, email, telephone and location from the CV.
- `src/lib/i18n.ts`: interface translations (not additional professional claims).
- `public/cv/NguyenThanhDong-EN.html` and `public/cv/NguyenThanhDong-VI.html`: viewable/printable CVs.

The actual CV title is **Software Developer**. The filename is not used to infer a seniority level. Overlapping Innocom / FE Credit dates and the CV's approximate percentages are retained. No demo, repository or social URL was supplied; generic links from the old profile were removed. The source CV's pending profile-link label is preserved in the translated CV.

`node scripts/extract-cv.mjs` refreshes the Vietnamese extraction. Update the English JSON to match before running `node scripts/translate-cv.mjs`, which recreates the English HTML and public CV copies. Both scripts use the installed Chrome via Playwright and block network requests.
