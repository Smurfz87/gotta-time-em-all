<script>
  import QRCode from 'qrcode'
  import jsQR from 'jsqr'
  import { readSession, writeSession, readSettings, writeSettings } from '$lib/storage.js'
  import { getInitials } from '$lib/utils.js'
  import PageShell from '$lib/PageShell.svelte'
  import { base } from '$app/paths'

  let settings = $state({ vibrateOnLap: false, ...readSettings() })
  let canVibrate = $state(false)

  $effect(() => { canVibrate = typeof navigator.vibrate === 'function' })
  $effect(() => { writeSettings($state.snapshot(settings)) })

  // --- QR Share ---
  let showQrModal = $state(false)
  let qrDataUrl = $state('')
  let qrNames = $state([])

  async function openQrModal() {
    const participants = readSession().participants ?? []
    if (participants.length === 0) {
      alert('Add participants on the timer screen first.')
      return
    }
    qrNames = participants.map(p => p.name)
    const payload = JSON.stringify({ v: 1, names: qrNames })
    qrDataUrl = await QRCode.toDataURL(payload, {
      width: 280, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
    showQrModal = true
  }

  // --- QR Scan ---
  let showScanModal = $state(false)
  let videoEl = $state(null)
  let canvasEl = $state(null)
  let scanStatus = $state('Initializing camera…')

  function openScanModal() {
    scanStatus = 'Initializing camera…'
    showScanModal = true
  }

  function closeScanModal() {
    showScanModal = false
  }

  $effect(() => {
    if (!showScanModal || !videoEl || !canvasEl) return
    let stopped = false
    let localStream = null
    let localInterval = null

    ;(async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (stopped) { localStream.getTracks().forEach(t => t.stop()); return }
        videoEl.srcObject = localStream
        await videoEl.play()
        scanStatus = 'Point camera at QR code'
        localInterval = setInterval(() => {
          if (!videoEl || videoEl.readyState < videoEl.HAVE_ENOUGH_DATA) return
          const ctx = canvasEl.getContext('2d')
          canvasEl.width = videoEl.videoWidth
          canvasEl.height = videoEl.videoHeight
          ctx.drawImage(videoEl, 0, 0)
          const img = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)
          const code = jsQR(img.data, img.width, img.height)
          if (code) {
            clearInterval(localInterval)
            localStream.getTracks().forEach(t => t.stop())
            handleScan(code.data)
          }
        }, 200)
      } catch {
        if (!stopped) scanStatus = 'Camera access denied'
      }
    })()

    return () => {
      stopped = true
      if (localInterval) clearInterval(localInterval)
      if (localStream) localStream.getTracks().forEach(t => t.stop())
    }
  })

  function handleScan(raw) {
    showScanModal = false
    let parsed
    try { parsed = JSON.parse(raw) } catch {
      alert('Invalid QR code.')
      return
    }
    if (!Array.isArray(parsed?.names) || parsed.names.length === 0) {
      alert('No participants found in QR code.')
      return
    }
    const existing = readSession().participants ?? []
    let replace = true
    if (existing.length > 0) {
      replace = confirm(
        `Import ${parsed.names.length} participant(s)?\n\nOK → Replace existing\nCancel → Add to existing`
      )
    }
    const incoming = parsed.names.map(name => ({
      id: crypto.randomUUID(),
      name,
      initials: getInitials(name)
    }))
    try {
      const session = readSession()
      session.participants = replace
        ? incoming
        : [...(session.participants ?? []), ...incoming]
      writeSession(session)
      alert(`Imported ${incoming.length} participant(s). Go back to the timer to see them.`)
    } catch {
      alert('Failed to save participants.')
    }
  }
</script>

<PageShell title="Settings" backLabel="Back to timer">
  <div class="sections">
    <div class="section">
      <div class="section-title">Roster</div>
      <a href="{base}/rosters" class="setting-row btn-row">
        <div class="setting-label">
          <span class="setting-title">Saved rosters</span>
          <span class="setting-desc">Save and load named participant lists</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
      <div class="row-divider"></div>
      <button class="setting-row btn-row" onclick={openQrModal}>
        <div class="setting-label">
          <span class="setting-title">Share roster</span>
          <span class="setting-desc">Show QR code to transfer participants</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
        </svg>
      </button>
      <div class="row-divider"></div>
      <button class="setting-row btn-row" onclick={openScanModal}>
        <div class="setting-label">
          <span class="setting-title">Scan roster</span>
          <span class="setting-desc">Import participants from QR code</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
    </div>

    {#if canVibrate}
      <div class="section">
        <div class="section-title">Feedback</div>
        <label class="setting-row">
          <div class="setting-label">
            <span class="setting-title">Vibrate on lap</span>
            <span class="setting-desc">50ms pulse when recording a lap</span>
          </div>
          <div class="toggle" class:on={settings.vibrateOnLap}>
            <input type="checkbox" bind:checked={settings.vibrateOnLap} aria-label="Vibrate on lap" />
            <span class="track"><span class="thumb"></span></span>
          </div>
        </label>
      </div>
    {/if}
  </div>
</PageShell>

<!-- QR display modal -->
{#if showQrModal}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Share roster"
    tabindex="-1"
    onclick={(e) => { if (e.target === e.currentTarget) showQrModal = false }}
    onkeydown={(e) => { if (e.key === 'Escape') showQrModal = false }}
  >
    <div class="modal">
      <div class="modal-header">
        <h2>Share Roster</h2>
        <button class="modal-close" onclick={() => showQrModal = false} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <img src={qrDataUrl} alt="Roster QR code" class="qr-img" />
        <p class="qr-names">{qrNames.join(' · ')}</p>
        <p class="qr-hint">{qrNames.length} participant{qrNames.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  </div>
{/if}

<!-- Scan modal -->
{#if showScanModal}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Scan roster"
    tabindex="-1"
    onkeydown={(e) => { if (e.key === 'Escape') closeScanModal() }}
  >
    <div class="modal">
      <div class="modal-header">
        <h2>Scan Roster</h2>
        <button class="modal-close" onclick={closeScanModal} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body scan-body">
        <div class="video-wrap">
          <video bind:this={videoEl} autoplay playsinline muted class="scan-video"></video>
          <div class="scan-overlay"></div>
        </div>
        <canvas bind:this={canvasEl} style="display:none"></canvas>
        <p class="scan-status">{scanStatus}</p>
        <button class="cancel-btn" onclick={closeScanModal}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .section-title {
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    gap: 16px;
    width: 100%;
    text-align: left;
  }

  .btn-row {
    background: transparent;
    cursor: pointer;
    transition: background 0.15s;
    text-decoration: none;
    color: inherit;
  }

  .btn-row:hover {
    background: var(--surface-raised);
  }

  .row-divider {
    height: 1px;
    background: var(--border);
    margin: 0 16px;
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .setting-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
  }

  .setting-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  .row-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  /* Toggle switch */
  .toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    display: block;
    width: 48px;
    height: 28px;
    border-radius: 14px;
    background: var(--surface-raised);
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle.on .track { background: var(--accent); }

  .thumb {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .toggle.on .thumb { transform: translateX(20px); }

  /* Modals */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 24px;
  }

  .modal {
    background: var(--surface);
    border-radius: var(--radius);
    width: 100%;
    max-width: 360px;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    transition: background 0.15s;
  }

  .modal-close:hover { background: var(--surface-raised); }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .qr-img {
    width: 240px;
    height: 240px;
    border-radius: 8px;
    display: block;
  }

  .qr-names {
    font-size: 13px;
    color: var(--text);
    text-align: center;
    line-height: 1.4;
  }

  .qr-hint {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Scan */
  .scan-body { gap: 16px; }

  .video-wrap {
    position: relative;
    width: 240px;
    height: 240px;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
  }

  .scan-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scan-overlay {
    position: absolute;
    inset: 20px;
    border: 2px solid var(--accent);
    border-radius: 8px;
    pointer-events: none;
  }

  .scan-status {
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }

  .cancel-btn {
    padding: 10px 32px;
    border-radius: var(--radius);
    background: var(--surface-raised);
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .cancel-btn:hover { background: var(--border); }
</style>