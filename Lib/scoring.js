// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------
export function zoneOf(pos) {
  if (pos <= 4) return "CL";
  if (pos <= 7) return "EUR";
  if (pos <= 17) return "MID";
  return "REL";
}

export function zoneColor(pos, C) {
  if (pos <= 4) return C.gold;
  if (pos <= 7) return C.europa;
  if (pos >= 18) return C.red;
  return "transparent";
}

export function zoneLabel(pos) {
  if (pos <= 4) return "Champions League";
  if (pos === 5) return "Europa League";
  if (pos <= 7) return "Conference / Europa";
  if (pos >= 18) return "Relegation";
  return "";
}

export function ordinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ---------------------------------------------------------------------------
// Live table built from finished matches: [{ gw, homeId, awayId, hg, ag }]
// ---------------------------------------------------------------------------
export function computeActualTable(teams, matchResults) {
  const table = {};
  teams.forEach((t, idx) => {
    table[t.id] = { id: t.id, pts: 0, gf: 0, ga: 0, played: 0, w: 0, d: 0, l: 0, seedIdx: idx };
  });
  matchResults.forEach((r) => {
    const h = table[r.homeId];
    const a = table[r.awayId];
    if (!h || !a) return;
    h.gf += r.hg;
    h.ga += r.ag;
    a.gf += r.ag;
    a.ga += r.hg;
    h.played++;
    a.played++;
    if (r.hg > r.ag) {
      h.pts += 3;
      h.w++;
      a.l++;
    } else if (r.hg < r.ag) {
      a.pts += 3;
      a.w++;
      h.l++;
    } else {
      h.pts += 1;
      a.pts += 1;
      h.d++;
      a.d++;
    }
  });
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const arr = Object.values(table).map((row) => ({ ...row, name: teamById[row.id].name, short: teamById[row.id].short }));
  arr.sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    const gdX = x.gf - x.ga;
    const gdY = y.gf - y.ga;
    if (gdY !== gdX) return gdY - gdX;
    if (y.gf !== x.gf) return y.gf - x.gf;
    return x.seedIdx - y.seedIdx;
  });
  return arr;
}

// ---------------------------------------------------------------------------
// Scoring
//   Per team, per gameweek:  max(0, 20 - 2*|diff|)  + 5 if the zone matches
//   Per gameweek: sum over all 20 teams, +100 bonus if every team is exact
//   Season total: sum of every gameweek's snapshot score so far
// ---------------------------------------------------------------------------
function pointsForTeam(predPos, actPos) {
  const diff = Math.abs(predPos - actPos);
  const base = Math.max(0, 20 - 2 * diff);
  const zoneBonus = zoneOf(predPos) === zoneOf(actPos) ? 5 : 0;
  return base + zoneBonus;
}

export function scoreSnapshot(predictedOrderIds, tableSnapshot) {
  const actualPosById = {};
  tableSnapshot.forEach((row, idx) => (actualPosById[row.id] = idx + 1));
  let total = 0;
  let perfect = true;
  predictedOrderIds.forEach((id, idx) => {
    const predPos = idx + 1;
    const actPos = actualPosById[id];
    if (actPos == null) {
      perfect = false;
      return;
    }
    total += pointsForTeam(predPos, actPos);
    if (predPos !== actPos) perfect = false;
  });
  if (perfect) total += 100;
  return total;
}

export function seasonScore(predictedOrderIds, teams, matchResults) {
  const maxGw = matchResults.reduce((m, x) => Math.max(m, x.gw || 0), 0);
  let total = 0;
  const weekly = [];
  for (let gw = 1; gw <= maxGw; gw++) {
    const snap = computeActualTable(teams, matchResults.filter((r) => r.gw <= gw));
    const s = scoreSnapshot(predictedOrderIds, snap);
    weekly.push({ gw, score: s });
    total += s;
  }
  return { total, weekly, gwCount: maxGw };
}
