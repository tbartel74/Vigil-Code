# Browser Extension Developer

## Overview
Chrome Manifest v3 browser extension for Vigil Guard providing client-side prompt injection protection through webhook proxy integration and browser fingerprinting.

## When to Use This Skill
- Developing Chrome extension (plugin/)
- Implementing Manifest v3 features
- Working with content scripts and background workers
- Managing webhook integration
- Implementing browser fingerprinting
- Debugging extension issues

## Tech Stack
- Manifest v3 (Chrome Extensions API)
- JavaScript ES6+ (no build step)
- Service Worker (background.js)
- Content Scripts (content.js)
- Popup UI (HTML/CSS)

## Project Structure

```
plugin/
├── manifest.json           # Extension manifest (Manifest v3)
├── background.js           # Service Worker (webhook proxy)
├── content.js              # Content script (ChatGPT integration)
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── config.js              # Shared configuration
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Installation guide
```

## Manifest v3 Structure

```json
{
  "manifest_version": 3,
  "name": "Vigil Guard Browser Extension",
  "version": "0.5.0",
  "description": "Client-side prompt injection protection for ChatGPT",

  "permissions": [
    "storage",          // Save webhook URL
    "activeTab"         // Access current tab
  ],

  "host_permissions": [
    "https://chat.openai.com/*",      // ChatGPT
    "http://localhost:5678/*"          // n8n webhook (dev)
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [{
    "matches": ["https://chat.openai.com/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

## Common Tasks

### Task 1: Content Script (ChatGPT Integration)

**Intercept Chat Messages:**
```javascript
// content.js
(function() {
  'use strict';

  // Generate unique client ID
  let clientId = localStorage.getItem('vigil_client_id');
  if (!clientId) {
    clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('vigil_client_id', clientId);
  }

  // Intercept form submission
  function interceptChatSubmit() {
    const form = document.querySelector('form[class*="composer"]');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      const textarea = form.querySelector('textarea');
      const userInput = textarea.value.trim();

      if (!userInput) return;

      // Get browser metadata
      const browserMetadata = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
      };

      // Send to Vigil Guard via background script
      chrome.runtime.sendMessage({
        type: 'ANALYZE_PROMPT',
        data: {
          chatInput: userInput,
          clientId: clientId,
          browser_metadata: browserMetadata
        }
      }, response => {
        if (response.status === 'ALLOWED' || response.status.startsWith('SANITIZE')) {
          // Allow submission (possibly with sanitized input)
          if (response.sanitized_input) {
            textarea.value = response.sanitized_input;
          }
          form.submit();
        } else if (response.status === 'BLOCKED') {
          // Show warning
          alert(`⚠️ Vigil Guard: Potential prompt injection detected!\n\nThreat Score: ${response.totalScore}\nCategories: ${response.detectedCategories.join(', ')}`);
        }
      });
    }, true);
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptChatSubmit);
  } else {
    interceptChatSubmit();
  }
})();
```

### Task 2: Background Service Worker (Webhook Proxy)

**Proxy Requests to n8n:**
```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_PROMPT') {
    // Get webhook URL from storage
    chrome.storage.sync.get(['webhookUrl'], async (items) => {
      const webhookUrl = items.webhookUrl || 'http://localhost:5678/webhook/default';

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...request.data,
            sessionId: `ext_${Date.now()}`
          })
        });

        const result = await response.json();
        sendResponse(result);

      } catch (error) {
        console.error('Vigil Guard error:', error);
        sendResponse({
          status: 'ALLOWED',  // Fail-open (graceful degradation)
          error: error.message
        });
      }
    });

    return true;  // Keep message channel open for async response
  }
});
```

### Task 3: Popup Configuration UI

**HTML:**
```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Vigil Guard Settings</title>
  <style>
    body { width: 300px; padding: 10px; font-family: Arial, sans-serif; }
    input { width: 100%; padding: 5px; margin: 5px 0; }
    button { width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    .status { margin-top: 10px; padding: 5px; border-radius: 3px; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h3>Vigil Guard Configuration</h3>

  <label>Webhook URL:</label>
  <input type="text" id="webhookUrl" placeholder="http://localhost:5678/webhook/xxx">

  <button id="save">Save Configuration</button>
  <button id="test">Test Connection</button>

  <div id="status"></div>

  <script src="popup.js"></script>
</body>
</html>
```

**JavaScript:**
```javascript
// popup.js
document.getElementById('save').addEventListener('click', () => {
  const webhookUrl = document.getElementById('webhookUrl').value;

  chrome.storage.sync.set({ webhookUrl }, () => {
    showStatus('Configuration saved!', 'success');
  });
});

document.getElementById('test').addEventListener('click', async () => {
  const webhookUrl = document.getElementById('webhookUrl').value;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: 'test',
        sessionId: 'extension_test'
      })
    });

    if (response.ok) {
      showStatus('✅ Connection successful!', 'success');
    } else {
      showStatus(`❌ Error: ${response.status}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Connection failed: ${error.message}`, 'error');
  }
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
}

// Load saved configuration
chrome.storage.sync.get(['webhookUrl'], (items) => {
  if (items.webhookUrl) {
    document.getElementById('webhookUrl').value = items.webhookUrl;
  }
});
```

### Task 4: Browser Fingerprinting

**Collect Metadata:**
```javascript
// config.js
function getBrowserFingerprint() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages.join(','),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
    touchSupport: 'ontouchstart' in window,
    webGL: getWebGLInfo(),
    canvas: getCanvasFingerprint()
  };
}

function getWebGLInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'not supported';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  return debugInfo ? {
    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  } : 'no debug info';
}

function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Vigil Guard Fingerprint', 2, 2);
  return canvas.toDataURL().substring(0, 50);  // Hash first 50 chars
}
```

## Testing & Development

### Local Testing
```bash
# 1. Load extension in Chrome
chrome://extensions/ → Enable Developer Mode → Load unpacked → Select plugin/

# 2. Test on ChatGPT
open https://chat.openai.com/

# 3. Check console
F12 → Console → Look for "Vigil Guard" messages

# 4. Verify webhook
docker logs vigil-n8n | grep "ext_"
```

### Debugging
```javascript
// background.js - Add logging
console.log('[Vigil Guard] Analyzing prompt:', request.data);

// content.js - Verify injection
console.log('[Vigil Guard] Content script loaded on:', window.location.href);
```

## Integration Points

### With workflow-json-architect:
```yaml
when: Extension sends request
action:
  1. Workflow receives browser_metadata + clientId
  2. Log to ClickHouse (client_id column)
  3. Track sessions by client fingerprint
```

### With clickhouse-grafana-monitoring:
```sql
-- Query extension usage
SELECT
  client_id,
  count() as requests,
  browser_metadata.userAgent
FROM n8n_logs.events_processed
WHERE client_id LIKE 'client_%'
GROUP BY client_id, browser_metadata.userAgent
ORDER BY requests DESC
```

## Troubleshooting

**Extension not loading:**
```bash
# Check manifest.json syntax
cat plugin/manifest.json | jq .

# Verify permissions
# Chrome → Extensions → Vigil Guard → Details → Permissions
```

**Content script not injecting:**
```javascript
// Add to manifest.json
"content_scripts": [{
  "matches": ["https://chat.openai.com/*"],
  "js": ["content.js"],
  "run_at": "document_end",  // Try "document_end" instead of "document_idle"
  "all_frames": false
}]
```

**CORS errors:**
```javascript
// Ensure host_permissions includes webhook domain
"host_permissions": [
  "http://localhost:5678/*",
  "https://yourdomain.com/*"  // Add production domain
]
```

## Quick Reference

```bash
# Package extension
cd plugin && zip -r vigil-guard-extension.zip *

# Install in Chrome
chrome://extensions/ → Load unpacked → Select plugin/

# View console
F12 → Console

# Check storage
chrome://extensions/ → Vigil Guard → Inspect views: service worker → Application → Storage
```

---
**Current Version:** v0.5.0
**Manifest:** v3
**Supported Sites:** ChatGPT (chat.openai.com)
**Status:** Active development
