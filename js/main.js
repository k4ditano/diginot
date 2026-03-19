// ═══════════════════════════════════════════
// DigiNot — Entry Point
// ═══════════════════════════════════════════

import { init } from './ui.js';

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
