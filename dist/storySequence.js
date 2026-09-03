/**
 * MARGA Story Sequence Animation Controller
 * High-performance, canvas-based scroll scrubbing from Frame 1 to Frame 480.
 * Supports universal window & container scrolling with floating HUD feedback.
 */

(function () {
  let manifest = [];
  const imageCache = new Map();
  let canvas, ctx;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let isTicking = false;
  let isInitialized = false;

  async function initStorySequence() {
    canvas = document.getElementById('sequenceCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Handle high-DPI scaling
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    try {
      const res = await fetch('/api/sequence-manifest');
      manifest = await res.json();
      console.log(`[Sequence HUD] Loaded ${manifest.length} animation frames.`);

      if (manifest && manifest.length > 0) {
        // Render Frame 1 immediately
        await preloadImage(0);
        currentFrameIndex = 0;
        targetFrameIndex = 0;
        drawFrame(0);
        updateHUD(0);

        // Preload next batch in background
        preloadBatch(1, 40);

        // Universal scroll listeners on window and document
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('scroll', onScroll, { passive: true });
        const container = document.querySelector('.main-content') || document.querySelector('.app-shell');
        if (container) {
          container.addEventListener('scroll', onScroll, { passive: true });
        }

        // Background preload remaining frames in progressive batches
        preloadRemainingFrames();

        isInitialized = true;
      }
    } catch (err) {
      console.error('[Sequence] Error loading manifest:', err);
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    if (manifest.length > 0) {
      drawFrame(currentFrameIndex);
    }
  }

  function getFrameUrl(index) {
    if (!manifest[index]) return null;
    return `/sequence/${manifest[index]}`;
  }

  function preloadImage(index) {
    if (imageCache.has(index)) return Promise.resolve(imageCache.get(index));
    return new Promise((resolve) => {
      const img = new Image();
      const url = getFrameUrl(index);
      if (!url) return resolve(null);
      img.src = url;
      img.onload = () => {
        imageCache.set(index, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
    });
  }

  async function preloadBatch(start, count) {
    const end = Math.min(manifest.length, start + count);
    const promises = [];
    for (let i = start; i < end; i++) {
      promises.push(preloadImage(i));
    }
    await Promise.all(promises);
  }

  async function preloadRemainingFrames() {
    const step = 25;
    for (let i = 40; i < manifest.length; i += step) {
      await preloadBatch(i, step);
      await new Promise(r => setTimeout(r, 60));
    }
  }

  function onScroll() {
    if (!isInitialized || manifest.length === 0) return;

    const storyTab = document.getElementById('tab-story');
    if (!storyTab || !storyTab.classList.contains('active')) return;

    // Measure scroll position universally across any layout or browser
    const winTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const container = document.querySelector('.main-content') || document.querySelector('.app-shell');
    const containerTop = container ? container.scrollTop : 0;
    const scrollTop = Math.max(winTop, containerTop);

    const docHeight = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body.scrollHeight || 0,
      storyTab.offsetHeight || 0,
      storyTab.scrollHeight || 0
    );

    const winHeight = window.innerHeight;
    const maxScroll = Math.max(1, docHeight - winHeight);

    // Strict ratio 0.0 -> 1.0
    const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));

    // Map exact frame index 0 to (manifest.length - 1)
    targetFrameIndex = Math.min(manifest.length - 1, Math.floor(scrollFraction * manifest.length));

    if (!isTicking) {
      requestAnimationFrame(updateFrame);
      isTicking = true;
    }
  }

  function updateFrame() {
    if (targetFrameIndex !== currentFrameIndex) {
      currentFrameIndex = targetFrameIndex;
      drawFrame(currentFrameIndex);
      updateHUD(currentFrameIndex);
    }
    isTicking = false;
  }

  function updateHUD(index) {
    const hud = document.getElementById('storyFrameHUD');
    const hudBar = document.getElementById('storyFrameHUDBar');
    if (manifest.length > 0) {
      const frameNum = index + 1;
      const total = manifest.length;
      const pct = Math.round((frameNum / total) * 100);
      if (hud) hud.innerText = `FRAME ${frameNum} / ${total} • ${pct}%`;
      if (hudBar) hudBar.style.width = `${pct}%`;
    }
  }

  function drawFrame(index) {
    if (!canvas || !ctx) return;

    let img = imageCache.get(index);
    if (!img) {
      preloadImage(index).then(loaded => {
        if (loaded && currentFrameIndex === index) {
          renderImg(loaded);
        }
      });
      img = findNearest(index);
    }

    if (img) {
      renderImg(img);
    }
  }

  function findNearest(index) {
    if (imageCache.has(index)) return imageCache.get(index);
    for (let dist = 1; dist < 50; dist++) {
      if (imageCache.has(index - dist)) return imageCache.get(index - dist);
      if (imageCache.has(index + dist)) return imageCache.get(index + dist);
    }
    return imageCache.get(0) || null;
  }

  function renderImg(img) {
    if (!canvas || !ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih || cw === 0 || ch === 0) return;

    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, cx, cy, nw, nh);
  }

  // Triggered when user navigates into story tab
  window.triggerStorySequence = function () {
    if (!isInitialized) {
      initStorySequence();
    } else {
      resizeCanvas();
      drawFrame(currentFrameIndex);
      updateHUD(currentFrameIndex);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initStorySequence();
  });
})();
