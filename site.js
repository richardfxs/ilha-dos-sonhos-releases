const OFFICIAL_VERSION = '1.0.0';
const RELEASES_API = 'https://api.github.com/repos/richardfxs/ilha-dos-sonhos-releases/releases/latest';
const RELEASES_FALLBACK = 'https://github.com/richardfxs/ilha-dos-sonhos-releases/releases/latest';

function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Mobile|Tablet/i.test(ua)) return 'other_mobile';
  return 'desktop';
}

document.querySelectorAll('[data-app-version]').forEach((el) => {
  el.textContent = `v${OFFICIAL_VERSION}`;
});

// Smart JOGAR button behavior: Desktop -> Web Game (/jogar/), Android -> APK Download Page, Others -> Guidance
const btnPlay = document.querySelector('#btnPlayPrimary');
const hintEl = document.querySelector('#deviceHint');
const device = detectDevice();

if (btnPlay) {
  if (device === 'android') {
    btnPlay.textContent = 'BAIXAR APK PARA ANDROID';
  }
  btnPlay.addEventListener('click', () => {
    if (device === 'desktop') {
      window.location.href = './jogar/';
    } else if (device === 'android') {
      window.location.href = './download.html';
    } else {
      if (hintEl) {
        hintEl.textContent = 'A versão mobile oficial atual está disponível em APK para Android. No computador, você pode jogar diretamente pelo navegador!';
      }
    }
  });
}

// Download page: resolve latest official APK asset from GitHub Releases automatically
const btnDownloadApk = document.querySelector('#btnDownloadApk');
const apkVersionEl = document.querySelector('#apkVersion');
const apkStatusEl = document.querySelector('#apkStatus');

if (btnDownloadApk) {
  fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || !data.tag_name) return;
      const ver = String(data.tag_name).replace(/^v/i, '');
      if (apkVersionEl) apkVersionEl.textContent = `v${ver}`;
      const apk = (data.assets || []).find((a) => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk'));
      if (apk && apk.browser_download_url && apk.browser_download_url.startsWith('https://')) {
        btnDownloadApk.href = apk.browser_download_url;
        const mb = apk.size ? ` (${(apk.size / (1024 * 1024)).toFixed(1)} MB)` : '';
        if (apkStatusEl) apkStatusEl.textContent = `Pronto para download direto: ${apk.name}${mb}`;
      } else if (data.html_url) {
        btnDownloadApk.href = data.html_url;
      }
    })
    .catch(() => {
      btnDownloadApk.href = RELEASES_FALLBACK;
    });
}
