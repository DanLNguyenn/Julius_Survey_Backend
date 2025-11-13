let deck = [];
let idx = 0;
let assessmentId = null;
let t0 = 0;

const $img = document.getElementById('img');
const $caption = document.getElementById('caption');
const $progress = document.getElementById('progress');
const $btnMe = document.getElementById('me');
const $btnNotMe = document.getElementById('notme');
const $btnDone = document.getElementById('done');
const $status = document.getElementById('status');

init().catch(err => $status.textContent = 'Init failed: ' + err);

async function init() {
  // 1) get deck
  const deckRes = await fetch('/api/deck');
  const deckJson = await deckRes.json();
  deck = deckJson.deck || [];
  if (!deck.length) { $status.textContent = 'No slides found.'; return; }

  // 2) start assessment
  const startRes = await fetch('/api/start', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model: 'both' })
  });
  const startJson = await startRes.json();
  assessmentId = startJson.assessmentId;

  // 3) wire controls
  $btnMe.onclick = () => choose('ME');
  $btnNotMe.onclick = () => choose('NOT_ME');
  $btnDone.onclick = finish;

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'm' || e.key === 'ArrowRight') choose('ME');
    if (k === 'n' || e.key === 'ArrowLeft')  choose('NOT_ME');
  });

  // 4) show first slide
  render(idx);
}

function render(i) {
  const s = deck[i];
  if (!s) return;
  $img.src = s.imageUrl;
  $img.alt = s.caption;
  $caption.textContent = s.caption;
  $progress.textContent = `${i+1}/${deck.length}`;
  $status.textContent = '';
  t0 = performance.now();

  // preload next
  const next = deck[Math.min(i+1, deck.length-1)];
  if (next) { const im = new Image(); im.src = next.imageUrl; }
}

async function choose(choice) {
  const s = deck[idx];
  if (!s) return;
  const rtMs = Math.round(performance.now() - t0);

  // save immediately
  try {
    await fetch('/api/answer', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ assessmentId, slideId: s.id, choice, rtMs })
    });
  } catch (e) {
    $status.textContent = 'Save failed (will still advance).';
  }

  if (idx < deck.length - 1) {
    idx += 1;
    render(idx);
  } else {
    $btnDone.classList.remove('hidden');
    document.getElementById('actions').classList.add('hidden');
    $status.textContent = 'All answers saved. Click Finish.';
  }
}

async function finish() {
  try {
    await fetch('/api/finish', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ assessmentId })
    });
    $status.textContent = 'Thanks! Your responses were recorded.';
    $btnDone.classList.add('hidden');
    document.getElementById('card').classList.add('hidden');
  } catch (e) {
    $status.textContent = 'Finish failed.';
  }
}
