// Passwortschutz: entschlüsselt die Seite im Browser (PBKDF2 → AES-256-CBC + HMAC-SHA256).
// Der abgeleitete Schlüssel bleibt nur für diese Browser-Sitzung gespeichert,
// damit Impressum und Datenschutz ohne erneute Eingabe aufgehen.
(() => {
  const STORE = 'dteam-key';
  const payload = JSON.parse(document.getElementById('gate-payload').textContent);
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-pw');
  const error = document.getElementById('gate-error');
  const button = form.querySelector('button');

  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

  const derive = async (password) => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: fromB64(payload.salt), iterations: payload.iter, hash: 'SHA-256' },
      base,
      512
    );
  };

  const unlock = async (bits) => {
    const key = new Uint8Array(bits);
    const aesKey = await crypto.subtle.importKey('raw', key.slice(0, 32), { name: 'AES-CBC' }, false, ['decrypt']);
    const macKey = await crypto.subtle.importKey('raw', key.slice(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const iv = fromB64(payload.iv);
    const ct = fromB64(payload.ct);
    const signed = new Uint8Array(iv.length + ct.length);
    signed.set(iv);
    signed.set(ct, iv.length);
    if (!(await crypto.subtle.verify('HMAC', macKey, fromB64(payload.mac), signed))) return false;

    const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, ct));
    try { sessionStorage.setItem(STORE, toB64(bits)); } catch (e) { /* privater Modus: dann eben jedes Mal */ }

    // Solange der Browser die Passwortseite noch aufbaut, würde document.open()
    // ignoriert und der Inhalt nur angehängt. Deshalb erst nach dem Laden ersetzen.
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => addEventListener('load', resolve, { once: true }));
    }

    const hash = location.hash;
    document.open();
    document.write(html);
    document.close();
    if (hash) {
      // Sprungmarke (z. B. #projekte) anspringen, sobald die Seite steht
      const jump = () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'instant' });
      if (document.readyState === 'complete') setTimeout(jump, 50);
      else addEventListener('load', () => setTimeout(jump, 50), { once: true });
    }
    return true;
  };

  const showForm = () => {
    document.documentElement.classList.remove('gate-auto');
    input.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    button.textContent = 'Wird geöffnet …';
    try {
      if (await unlock(await derive(input.value))) return;
    } catch (e) { /* falscher Schlüssel oder beschädigte Daten */ }
    button.disabled = false;
    button.textContent = 'Seite öffnen';
    error.hidden = false;
    input.select();
  });

  let stored = null;
  try { stored = sessionStorage.getItem(STORE); } catch (e) { /* ignorieren */ }
  if (stored) {
    unlock(fromB64(stored).buffer).then((ok) => {
      if (!ok) {
        try { sessionStorage.removeItem(STORE); } catch (e) { /* ignorieren */ }
        showForm();
      }
    }, showForm);
  } else {
    showForm();
  }
})();
