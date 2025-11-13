require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path'); 

const app = express();
app.use(express.json());

// log every request
app.use((req,res,next)=>{ console.log('[REQ]', req.method, req.url); next(); });

// show what DB URL the app sees (once at boot)
console.log('DB URL seen by server:', process.env.DATABASE_URL);

// Create a connection pool based on the .env DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// helper
async function q(text, params) {
  const client = await pool.connect();
  try { return await client.query(text, params); }
  finally { client.release(); }
}

// serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- API for the image quiz (no scoring) ----------------

// 1) get deck (5 images)
// app.get('/api/deck', async (req, res) => {
//   try {
//     const { rows } = await pool.query(
//       'SELECT id, image_url AS "imageUrl", caption FROM slides WHERE active = true ORDER BY id ASC'
//     );
//     res.json({ deck: rows });
//   } catch (err) {
//     console.error('DECK_ERR:', err); // <-- will show the real reason
//     res.status(500).json({ error: 'deck_failed', detail: err.message });
//   }
// });

app.get('/api/deck', async (req, res) => {
  try {
    const { rows } = await q(
      `SELECT id, image_url AS "imageUrl", caption
         FROM slides
        WHERE active = true
        ORDER BY id ASC
        LIMIT 100`
    );
    res.json({ deck: rows });
  } catch (e) {
    console.error('DECK_ERR:', e);  // <-- log full error object in container
    res.status(500).json({ error: 'deck_failed', detail: e.message });
  }
});

// 2) start assessment (returns assessmentId)
app.post('/api/start', async (req, res) => {
  try {
    const { userId, model } = req.body || {};
    const r = await q(
      `INSERT INTO assessments (user_id, model)
       VALUES ($1, COALESCE($2,'both'))
       RETURNING id, started_at`,
      [userId || null, model || 'both']
    );
    res.json({ assessmentId: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'start_failed' });
  }
});

// 3) save one answer (called on each click)
app.post('/api/answer', async (req, res) => {
  try {
    const { assessmentId, slideId, choice, rtMs } = req.body || {};
    if (!assessmentId || !slideId || !['ME','NOT_ME'].includes(choice)) {
      return res.status(400).json({ error: 'bad_payload' });
    }
    await q(
      `INSERT INTO responses (assessment_id, slide_id, choice, rt_ms)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (assessment_id, slide_id) DO UPDATE
       SET choice=EXCLUDED.choice, rt_ms=EXCLUDED.rt_ms`,
      [assessmentId, slideId, choice, rtMs ?? null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'answer_failed' });
  }
});

// optional: finish (marks complete; still no scoring)
app.post('/api/finish', async (req, res) => {
  try {
    const { assessmentId, secsTaken } = req.body || {};
    if (!assessmentId) return res.status(400).json({ error: 'missing_assessment' });
    await q(
      `UPDATE assessments
          SET completed_at = now(),
              secs_taken = COALESCE($2, secs_taken)
        WHERE id = $1`,
      [assessmentId, secsTaken ?? null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'finish_failed' });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/dbcheck', async (req, res) => {
  try {
    const a = await q('SELECT current_database() AS db, current_user AS usr');
    const b = await q(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'slides'
    `);

    let slideRows = null;
    if (Number(b.rows[0].cnt) > 0) {
      const c = await q('SELECT COUNT(*) AS cnt FROM slides');
      slideRows = Number(c.rows[0].cnt);
    }

    res.json({
      ok: true,
      db: a.rows[0].db,
      user: a.rows[0].usr,
      hasSlidesTable: Number(b.rows[0].cnt),
      slideRows,
    });
  } catch (e) {
    console.error('DBCHECK_ERR:', e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
