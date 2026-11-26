const DEFAULT_VERSION = '1.2.3';
const APK_SAME_ORIGIN_URL = './downloads/ilha-dos-sonhos.apk';
const META_SAME_ORIGIN_URL = './downloads/meta.json';
const UPDATES_URL = './updates.json';

function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Mobile|Tablet/i.test(ua)) return 'other_mobile';
  return 'desktop';
}

function formatSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
}

function applyVersion(ver) {
  const clean = String(ver || DEFAULT_VERSION).replace(/^v/i, '').trim();
  document.querySelectorAll('[data-app-version]').forEach((el) => {
    el.textContent = `v${clean}`;
  });
}
applyVersion(DEFAULT_VERSION);

// 1. Minimal Floating Nav + Mobile Drawer
const siteNav = document.querySelector('#siteNav');
const navToggle = document.querySelector('#navToggle');
const navLinks = document.querySelector('#navLinks');

if (siteNav) {
  const onScroll = () => siteNav.classList.toggle('scrolled', window.scrollY > 18);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

if (navToggle && navLinks) {
  const closeNav = () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

// 2. Primary JOGAR button (PRESERVED: Desktop -> ./jogar/, Android -> ./download.html, Others -> Guidance)
const btnPlay = document.querySelector('#btnPlayPrimary');
const hintEl = document.querySelector('#deviceHint');
const device = detectDevice();

if (btnPlay) {
  btnPlay.addEventListener('click', () => {
    if (device === 'desktop') {
      window.location.href = './jogar/';
    } else if (device === 'android') {
      window.location.href = './download.html';
    } else if (hintEl) {
      hintEl.textContent = 'A versão mobile atual está disponível em APK para Android. No computador, você pode jogar diretamente pelo navegador.';
    }
  });
}

// 3. Hydrate compact Updates card from updates.json (easy to maintain in future releases)
async function hydrateUpdates() {
  const titleEl = document.querySelector('#updateTitle');
  const dateEl = document.querySelector('#updateDate');
  const summaryEl = document.querySelector('#updateSummary');
  if (!titleEl && !summaryEl) return;
  try {
    const res = await fetch(UPDATES_URL, { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    const cur = data?.current;
    if (!cur) return;
    if (cur.version) applyVersion(cur.version);
    if (cur.date && dateEl) dateEl.textContent = cur.date;
    if (cur.title && titleEl) titleEl.textContent = cur.title;
    if (cur.summary && summaryEl) summaryEl.textContent = cur.summary;
  } catch {}
}
hydrateUpdates();

// 4. Verify Same-Origin Direct APK on both Home (#btnDirectApk) and Download Page (#btnDownloadApk)
async function verifyDirectApk() {
  const apkButtons = [
    document.querySelector('#btnDirectApk'),
    document.querySelector('#btnDownloadApk'),
  ].filter(Boolean);
  if (apkButtons.length === 0) return;

  const apkSizeEl = document.querySelector('#apkSize');
  const apkStatusEl = document.querySelector('#apkStatus');

  let version = DEFAULT_VERSION;
  let sizeBytes = 0;

  try {
    const metaRes = await fetch(META_SAME_ORIGIN_URL, { cache: 'no-cache' });
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta?.version) version = meta.version;
      if (meta?.sizeBytes) sizeBytes = Number(meta.sizeBytes) || 0;
    }
  } catch {}

  applyVersion(version);

  try {
    const headRes = await fetch(APK_SAME_ORIGIN_URL, { method: 'HEAD', cache: 'no-cache' });
    if (!headRes.ok) throw new Error(`HTTP ${headRes.status}`);

    const headerLen = Number(headRes.headers.get('content-length')) || 0;
    const formattedSize = formatSize(headerLen > 0 ? headerLen : sizeBytes);

    apkButtons.forEach((btn) => {
      btn.setAttribute('href', APK_SAME_ORIGIN_URL);
      btn.setAttribute('download', 'ilha-dos-sonhos.apk');
      btn.removeAttribute('aria-disabled');
    });

    if (apkSizeEl) apkSizeEl.textContent = formattedSize || 'Disponível';
    if (apkStatusEl) {
      apkStatusEl.classList.remove('warn');
      apkStatusEl.classList.add('ok');
      apkStatusEl.textContent = formattedSize
        ? `Arquivo oficial verificado (${formattedSize}) pronto para download direto.`
        : 'Arquivo oficial verificado e pronto para download direto.';
    }
  } catch {
    apkButtons.forEach((btn) => {
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
    });
    if (apkSizeEl) apkSizeEl.textContent = 'Indisponível';
    if (apkStatusEl) {
      apkStatusEl.classList.remove('ok');
      apkStatusEl.classList.add('warn');
      apkStatusEl.textContent = 'O arquivo APK está temporariamente indisponível. Tente novamente em instantes ou jogue pelo navegador no computador.';
    }
    if (hintEl && !apkStatusEl) {
      hintEl.textContent = 'O download do APK está temporariamente indisponível no momento.';
    }
  }
}
verifyDirectApk();

// 5. Smooth Reveal + Subtle Hero Parallax + Crimson/Gold Ambient Embers (prefers-reduced-motion safe)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('[data-reveal]');

if (revealEls.length > 0) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach((el) => observer.observe(el));
  }
}

const heroImg = document.querySelector('#heroParallaxImg');
if (heroImg && !prefersReducedMotion && device === 'desktop') {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, 540);
      heroImg.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.04)`;
      ticking = false;
    });
  }, { passive: true });
}

const canvas = document.querySelector('#ambientParticles');
if (canvas && !prefersReducedMotion) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    let w = 0;
    let h = 0;
    const count = device === 'desktop' ? 22 : 9;
    const embers = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (let i = 0; i < count; i++) {
      embers.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.14 - Math.random() * 0.26,
        alpha: 0.18 + Math.random() * 0.42,
        crimson: i % 2 === 0,
      });
    }

    const draw = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h);
        for (const p of embers) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.crimson
            ? `rgba(255, 46, 76, ${p.alpha})`
            : `rgba(243, 186, 99, ${p.alpha * 0.85})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
}


// 6. LGPD Consent Preferences & Editorial AdSense Preparation (inactive until approved Publisher ID is set)
const CONSENT_STORAGE_KEY = 'ilha-dos-sonhos-site-consent-v1';
const ADSENSE_PREP_CONFIG = Object.freeze({
  enabled: false,
  publisherId: '', // NEVER invent a Publisher ID; populate only after official Google AdSense approval
});

function readConsentPrefs() {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      advertising: Boolean(parsed.advertising),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

function saveConsentPrefs(advertising) {
  const prefs = { essential: true, advertising: Boolean(advertising), updatedAt: Date.now() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
  return prefs;
}

function ensureConsentModal() {
  let modal = document.querySelector('#siteConsentModal');
  if (modal) return modal;

  modal = document.createElement('aside');
  modal.id = 'siteConsentModal';
  modal.className = 'consent-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Preferências de Privacidade e Cookies');
  modal.hidden = true;
  modal.innerHTML = `
    <div class="consent-card">
      <div class="consent-head">
        <strong>Preferências de Privacidade (LGPD)</strong>
        <button type="button" class="consent-close" id="btnCloseConsent" aria-label="Fechar">✕</button>
      </div>
      <p>
        Usamos armazenamento técnico essencial para preferências do site. Cookies de publicidade editorial (Google AdSense) permanecem desativados nesta etapa e só serão utilizados mediante sua autorização após aprovação oficial.
      </p>
      <label class="consent-toggle">
        <input type="checkbox" checked disabled />
        <span><strong>Essenciais (sempre ativo):</strong> funcionamento básico e preferências.</span>
      </label>
      <label class="consent-toggle">
        <input type="checkbox" id="consentAdsCheckbox" />
        <span><strong>Publicidade editorial (opcional):</strong> anúncios discretos no site institucional quando ativados.</span>
      </label>
      <div class="consent-actions">
        <button type="button" class="btn-obsidian consent-btn" id="btnConsentEssentialOnly">Apenas essenciais</button>
        <button type="button" class="btn-crimson consent-btn" id="btnConsentSave">Salvar escolha</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => { modal.hidden = true; };
  modal.querySelector('#btnCloseConsent')?.addEventListener('click', close);
  modal.querySelector('#btnConsentEssentialOnly')?.addEventListener('click', () => {
    saveConsentPrefs(false);
    close();
  });
  modal.querySelector('#btnConsentSave')?.addEventListener('click', () => {
    const checked = Boolean(modal.querySelector('#consentAdsCheckbox')?.checked);
    saveConsentPrefs(checked);
    close();
  });
  return modal;
}

document.querySelectorAll('[data-open-consent]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = ensureConsentModal();
    const cur = readConsentPrefs();
    const cb = modal.querySelector('#consentAdsCheckbox');
    if (cb) cb.checked = Boolean(cur?.advertising);
    modal.hidden = false;
  });
});

// Auto-prompt consent banner ONLY when real AdSense is officially approved & configured
if (ADSENSE_PREP_CONFIG.enabled && ADSENSE_PREP_CONFIG.publisherId && !readConsentPrefs()) {
  const modal = ensureConsentModal();
  modal.hidden = false;
}
