# Accessibility manual checks (release branch)

Run once per release candidate and note results in the PR description.

- VoiceOver (Safari): rotor landmarks, headings, links; form labels when auth ships.
- Keyboard only: skip link visible on focus; no keyboard traps; modals trap focus when added.
- Windows: NVDA + Edge or Firefox on a representative journey.
- Zoom 200%: no horizontal clipping on core marketing pages.
- Windows High Contrast: readable focus and text on home + about.
- Reduced motion: enable OS setting; decorative motion should reduce to a static or minimal state.
