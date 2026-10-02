export type Product = {
  slug: string
  name: string
  category: 'Developer tools' | 'Writing' | 'Capture & create' | 'Media'
  line: string  description: string
  features: { title: string; text: string }[]
  steps: string[]
  limitations: string
  privacy: string
  faqs: { question: string; answer: string }[]
  version: string
  chrome: string
  storeUrl: string | null
}

// Add published Chrome Web Store URLs here. Null keeps installation disabled.
export const products: Product[] = [
  {
    slug: 'debug2ai', name: 'Debug2AI', category: 'Developer tools',
    line: 'Turn browser errors into one AI-ready debugging report.',    description: 'Capture console errors, failed requests, page context, and a screenshot. Give your AI assistant the whole picture without the DevTools copy-and-paste routine.',
    features: [
      { title: 'Console errors and failed requests', text: 'Collect console issues, JavaScript exceptions, failed network requests, and recent interactions after starting a capture.' },
      { title: 'Export a Markdown report', text: 'Copy or download an AI-ready Markdown report. Copy or download the visible-page screenshot separately.' },
      { title: 'Use with your preferred AI assistant', text: 'Paste the report into your preferred AI chatbot. Debug2AI does not call an AI service or require an API key.' },
    ],
    steps: ['Open the page with the bug and start a capture.', 'Reproduce the issue, then create your debug report.', 'Copy the report and screenshot into your preferred AI assistant.'],
    limitations: 'Capture starts when you ask—not retroactively. Chrome shows a debugging banner while capturing. Opening DevTools on the same tab can detach capture. Browser-protected pages cannot be captured.',
    privacy: 'Capture data is processed locally. No request bodies, cookies, or typed text are collected. Obvious secrets are redacted heuristically; inspect reports before sharing them with another service.',
    faqs: [
      { question: 'Does Debug2AI send my data to an AI?', answer: 'No. It creates a local report. You decide whether to copy that report into a third-party AI service.' },
      { question: 'Can it capture an error that already happened?', answer: 'No. Start the capture first, then reproduce the issue.' },
      { question: 'Why does Chrome show a debugging banner?', answer: 'Debug2AI uses Chrome’s debugger permission to collect structured console and network failures during an active capture.' },
    ], version: '0.1.0', chrome: '116+', storeUrl: null,
  },
  {
    slug: 'draft-rescue', name: 'Draft Rescue', category: 'Writing',
    line: 'Save website text fields and refill them when you need them.',    description: 'Keep a local snapshot of supported website text fields. Come back to your writing, search earlier versions, and refill matching fields without starting over.',
    features: [
      { title: 'Save text fields', text: 'Save supported text fields on the current page in one snapshot, then refill matching fields from the popup.' },
      { title: 'Search saved drafts', text: 'Search your local archive by text, title, field, or website and choose an earlier saved version.' },
      { title: 'Copy and export drafts', text: 'Copy individual text, export a text file, or export your complete archive as JSON for safekeeping.' },
    ],
    steps: ['Fill out supported text fields on a regular website.', 'Open Draft Rescue and choose Save Website.', 'Return to the original page and select a saved snapshot to refill matching fields.'],
    limitations: 'Manual saving is the default. Refilling replaces matching current values and does not submit the form. Advanced editors, dropdowns, checkboxes, and cross-origin frames are not supported. This is not a guaranteed or encrypted backup.',
    privacy: 'Drafts stay in local browser storage. Passwords and suspected payment fields are excluded, but filtering is heuristic. Avoid saving confidential information on shared devices. Retention defaults to seven days.',
    faqs: [
      { question: 'Does it automatically save every website?', answer: 'No. Manual Save Website is the default. Legacy autosave can be enabled in Settings for supported, explicitly enabled websites.' },
      { question: 'Will it restore formatting?', answer: 'No. Draft Rescue restores supported text values, not rich formatting or a copy of the website.' },
      { question: 'Can I import a JSON backup?', answer: 'This version supports archive export but not JSON import. Individual saved text can also be copied.' },
    ], version: '1.2.0', chrome: '120+', storeUrl: null,
  },
  {
    slug: 'page-capture', name: 'Page Capture', category: 'Capture & create',
    line: 'Capture, crop, and redact webpages before you share them.',    description: 'Capture a full webpage or its visible area, tidy it up in a local editor, and download a PNG, JPG, or image-based PDF.',
    features: [
      { title: 'Full-page and visible-area screenshots', text: 'Capture a scrolling page, the visible area, or a selected area using the editor’s crop tool.' },
      { title: 'Crop and redact screenshots', text: 'Crop your capture and apply solid-black redaction rectangles to the image pixels. One-step undo is available.' },
      { title: 'Export PNG, JPG, or PDF', text: 'Download PNG, JPG, or a paginated, image-based A4 PDF directly from the local editor.' },
    ],
    steps: ['Open a regular webpage and choose a capture mode.', 'Crop or redact the image in the editor.', 'Inspect your capture and download it in your preferred format.'],
    limitations: 'Full-page capture has size limits and may miss nested scrolling or changing layouts. PDFs are raster images, not searchable text. Closing the editor loses unsaved work. Inspect exported files before sharing.',
    privacy: 'Images are processed locally, not uploaded. Temporary capture records are removed after stitching; unopened records expire and are cleaned on the next capture. Downloaded files remain on your device.',
    faqs: [
      { question: 'Can I export to PDF?', answer: 'Yes. Page Capture exports an image-based, A4-paginated PDF. It is not a searchable or accessible text PDF.' },
      { question: 'Does it capture every possible page?', answer: 'No. Infinite pages, unusual frames, nested scrollers, and dynamic content may be incomplete. Protected browser pages are unsupported.' },
      { question: 'Are screenshots uploaded?', answer: 'No. Capture, editing, and export happen locally in your browser.' },
    ], version: '1.0.0', chrome: '120+', storeUrl: null,
  },
  {
    slug: 'page-ink', name: 'Page Ink', category: 'Capture & create',
    line: 'Draw and highlight directly on the webpage in front of you.',    description: 'A floating pen, highlighter, and eraser for the web. Mark up a design, explain a detail, or guide someone through a page without switching tools.',
    features: [
      { title: 'Pen, highlighter, and eraser', text: 'Draw with a pen or highlighter, erase whole strokes, and undo or redo changes.' },
      { title: 'Movable toolbar and Pointer mode', text: 'Move or minimize the floating toolbar. Switch to Pointer mode to scroll and use the website normally.' },
      { title: 'Export annotations as PNG', text: 'Download a PNG of the visible page with your annotations, without the toolbar.' },
    ],
    steps: ['Open a webpage and click Page Ink to reveal the toolbar.', 'Choose Pen or Highlighter and mark up the page.', 'Download the visible page as a PNG before refreshing or navigating away.'],
    limitations: 'Ink lives in page memory and is lost on refresh or navigation. Dynamic layouts may misalign strokes. Full-page export, pressure sensitivity, desktop drawing, and protected pages are not supported.',
    privacy: 'No remote upload or account. Drawing stays in page memory. Toolbar appearance preferences and notice acknowledgement are stored locally.',
    faqs: [
      { question: 'Will my drawings survive a refresh?', answer: 'No. Annotations are temporary. Download a PNG before refreshing or navigating away.' },
      { question: 'Can I still interact with the webpage?', answer: 'Yes. Choose Pointer mode or press Escape to use and scroll the underlying website.' },
      { question: 'Is there a keyboard shortcut?', answer: 'Alt+Shift+D opens or hides the toolbar. In drawing mode, Ctrl/Cmd+Z undoes changes outside editable fields.' },
    ], version: '1.0.0', chrome: '120+', storeUrl: null,
  },
  {
    slug: 'video-speed-booster', name: 'Video Speed Booster', category: 'Media',
    line: 'Set the pace of supported videos, from 0.25× to 16×.',    description: 'Slow down a difficult section or move faster through a familiar one. Control supported HTML videos in a tab, or share one speed across websites.',
    features: [
      { title: 'Custom playback speed', text: 'Choose an integer preset from 2× to 16× or enter a custom speed between 0.25× and 16×.' },
      { title: 'Per-tab and global speed settings', text: 'Control supported videos in the active tab, or apply a shared global speed to supported websites and new tabs.' },
      { title: 'Turn off or reset video speed', text: 'Turn speed control off while keeping your settings, reset to 1×, or release the current tab.' },
    ],
    steps: ['Open a website with a supported HTML video.', 'Choose a preset or set your own playback speed.', 'Keep it on this tab, or enable Apply globally for a shared speed.'],
    limitations: 'Not every player supports every speed. Live streams, closed shadow roots, and player-enforced limits may prevent control. High speeds may mute audio or drop frames. Audio-only elements are not modified.',
    privacy: 'Preferences are stored locally with no backend or uploads. HTTP/HTTPS site access is required for global video control.',
    faqs: [
      { question: 'What speed range is supported?', answer: 'Custom speeds range from 0.25× to 16×. Actual playback depends on the browser and website player.' },
      { question: 'Does global mode work on new tabs?', answer: 'Yes, for supported HTML videos on websites where the extension has site access.' },
      { question: 'Does it change audio-only playback?', answer: 'No. This extension intentionally controls video elements only.' },
    ], version: '1.0.0', chrome: '120+', storeUrl: null,
  },
  {
    slug: 'sound-booster', name: 'Sound Booster', category: 'Media',
    line: 'Adjust activated tab audio with volume controls up to 600%.',    description: 'Control the volume of an activated browser tab with local audio processing. Choose a preset or share the same volume across tabs you have activated.',
    features: [
      { title: 'Volume slider and presets', text: 'Adjust from 0% to 600%, with presets at 100%, 200%, 400%, and 600%. Start at 100% and increase cautiously.' },
      { title: 'Shared volume for activated tabs', text: 'Apply globally shares volume across activated tabs. Each new tab still needs your explicit activation.' },
      { title: 'Stop audio processing', text: 'Stop capture for one tab or switch everything off. Your preferences stay saved for next time.' },
    ],
    steps: ['Open an unmuted website tab that is playing audio.', 'Click Sound Booster and turn it on for that tab.', 'Start at 100% and adjust gradually; activate other tabs individually if needed.'],
    limitations: 'High gain can distort audio and harm hearing. Protected media may not work. Processing can add latency or conflict with other capture extensions. Active streams do not survive a browser restart.',
    privacy: 'Audio is processed locally with Web Audio. No recording, uploads, or microphone capture. The extension captures a tab’s audio only after a user action.',
    faqs: [
      { question: 'Does global mode capture every tab automatically?', answer: 'No. It shares a setting across tabs you have activated. Chrome requires a user action to start audio capture for each new tab.' },
      { question: 'Does it record audio or use my microphone?', answer: 'No. It processes activated tab audio locally without recording or microphone access.' },
      { question: 'Is 600% always safe or distortion-free?', answer: 'No. Start at 100% and increase cautiously. High amplification can distort sound and harm hearing.' },
    ], version: '1.0.0', chrome: '120+', storeUrl: null,
  },
]

export const brand = 'Bloomollo'
export const homeDescription = 'Six focused Chrome extensions for debugging, saving drafts, capturing pages, drawing on the web, and controlling video and audio. Explore the Bloomollo collection.'