/** Self-contained Telegram Mini App scaffold served by the webhook server. */

export const webAppHtml = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  <title>Field note</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    :root {
      --sky: #dff4ff;
      --paper: #f9fcfe;
      --ink: #102b3c;
      --muted: #5d7482;
      --telegram: #229ed9;
      --signal: #ff6b5f;
      --line: #acd7ea;
      font-family: ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif;
      color: var(--ink);
      background: var(--sky);
    }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      padding: max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom));
      display: grid;
      place-items: center;
      background:
        linear-gradient(135deg, transparent 48%, rgb(34 158 217 / 8%) 48% 52%, transparent 52%),
        var(--sky);
    }
    main {
      width: min(100%, 430px);
      position: relative;
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 28px 28px 28px 8px;
      background: var(--paper);
      box-shadow: 0 24px 70px rgb(16 43 60 / 14%);
      overflow: hidden;
    }
    .route {
      position: absolute;
      width: 150px;
      height: 90px;
      right: -24px;
      top: -16px;
      border: 2px dashed var(--line);
      border-left-color: transparent;
      border-bottom-color: transparent;
      border-radius: 50%;
      transform: rotate(-12deg);
      pointer-events: none;
    }
    .route::after {
      content: "➤";
      position: absolute;
      right: 15px;
      bottom: -8px;
      color: var(--signal);
      font-size: 24px;
      transform: rotate(26deg);
    }
    .eyebrow {
      margin: 0 0 14px;
      color: var(--telegram);
      font: 700 12px/1 ui-monospace, "Cascadia Code", monospace;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 290px;
      margin: 0;
      font-size: clamp(34px, 10vw, 52px);
      line-height: .95;
      letter-spacing: -.055em;
    }
    .lede {
      max-width: 32ch;
      margin: 18px 0 26px;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.5;
    }
    label {
      display: block;
      margin-bottom: 9px;
      font-size: 13px;
      font-weight: 750;
    }
    textarea {
      width: 100%;
      min-height: 118px;
      resize: vertical;
      padding: 15px 16px;
      border: 1px solid var(--line);
      border-radius: 16px 16px 16px 5px;
      color: var(--ink);
      background: #fff;
      font: inherit;
      line-height: 1.45;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    textarea:focus-visible {
      border-color: var(--telegram);
      box-shadow: 0 0 0 4px rgb(34 158 217 / 16%);
    }
    button {
      width: 100%;
      margin-top: 14px;
      padding: 14px 18px;
      border: 0;
      border-radius: 14px 14px 14px 5px;
      color: #fff;
      background: var(--ink);
      font: 750 15px/1.2 inherit;
      cursor: pointer;
      transition: transform 150ms ease, background 150ms ease;
    }
    button:hover { background: var(--telegram); }
    button:active { transform: translateY(1px); }
    button:focus-visible { outline: 3px solid var(--signal); outline-offset: 3px; }
    button:disabled { opacity: .55; cursor: wait; }
    #status {
      min-height: 20px;
      margin: 12px 2px 0;
      color: var(--muted);
      font-size: 13px;
    }
    #status[data-error="true"] { color: #a52f29; }
    @media (prefers-color-scheme: dark) {
      :root { --sky: #0b1b25; --paper: #102b3c; --ink: #eff9ff; --muted: #a9c0cc; --line: #31586b; }
      textarea { background: #0b202c; }
      button { color: #102b3c; background: #eff9ff; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition: none !important; }
    }
  </style>
</head>
<body>
  <main>
    <span class="route" aria-hidden="true"></span>
    <p class="eyebrow">Bot field note</p>
    <h1>Send one clear signal.</h1>
    <p class="lede">Write a short note. It returns securely to the chat that opened this window.</p>
    <form id="note-form">
      <label for="note">Your note</label>
      <textarea id="note" maxlength="500" required placeholder="What should the bot remember?"></textarea>
      <button id="send" type="submit">Send note</button>
      <p id="status" role="status" aria-live="polite"></p>
    </form>
  </main>
  <script>
    const telegram = window.Telegram?.WebApp;
    const form = document.getElementById('note-form');
    const note = document.getElementById('note');
    const send = document.getElementById('send');
    const status = document.getElementById('status');

    telegram?.ready();
    telegram?.expand();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.dataset.error = 'false';
      status.textContent = 'Checking Telegram session…';
      send.disabled = true;

      try {
        if (!telegram?.initData) throw new Error('Open this page from the bot to continue.');
        const response = await fetch('/webapp/validate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: telegram.initData }),
        });
        if (!response.ok) throw new Error('Your Telegram session expired. Reopen the app from the bot.');

        telegram.sendData(JSON.stringify({ action: 'submit', value: note.value.trim() }));
        status.textContent = 'Note sent.';
        setTimeout(() => telegram.close(), 350);
      } catch (error) {
        status.dataset.error = 'true';
        status.textContent = error instanceof Error ? error.message : 'The note could not be sent.';
        send.disabled = false;
      }
    });
  </script>
</body>
</html>`;
