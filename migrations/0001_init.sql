-- Audience du portfolio.
--
-- Une ligne par évènement, sans identifiant d'utilisateur : ni IP, ni cookie,
-- ni empreinte. Le pays vient de l'en-tête Cloudflare, le référent est réduit
-- à son nom de domaine.

CREATE TABLE IF NOT EXISTS events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ts       INTEGER NOT NULL,          -- millisecondes epoch
  kind     TEXT    NOT NULL,          -- 'visit' | 'project'
  slug     TEXT,                      -- projet ouvert, NULL pour 'visit'
  profile  TEXT,                      -- 'web' | 'cpp'
  lang     TEXT    NOT NULL,          -- 'fr' | 'en'
  rank     INTEGER,                   -- 1 = premier projet ouvert de la visite
  country  TEXT,                      -- code ISO à deux lettres
  referrer TEXT                       -- nom de domaine d'origine
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);
CREATE INDEX IF NOT EXISTS idx_events_ts   ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events (kind);
