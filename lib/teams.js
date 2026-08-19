// 2026-27 Premier League — seeded from the actual 2025-26 final table
// (relegated teams removed, promoted teams added at the bottom).
export const TEAMS = [
  { id: "ars", name: "Arsenal", short: "ARS", lastSeasonPos: 1 },
  { id: "mci", name: "Manchester City", short: "MCI", lastSeasonPos: 2 },
  { id: "mun", name: "Manchester United", short: "MUN", lastSeasonPos: 3 },
  { id: "avl", name: "Aston Villa", short: "AVL", lastSeasonPos: 4 },
  { id: "liv", name: "Liverpool", short: "LIV", lastSeasonPos: 5 },
  { id: "bou", name: "Bournemouth", short: "BOU", lastSeasonPos: 6 },
  { id: "sun", name: "Sunderland", short: "SUN", lastSeasonPos: 7 },
  { id: "bha", name: "Brighton", short: "BHA", lastSeasonPos: 8 },
  { id: "bre", name: "Brentford", short: "BRE", lastSeasonPos: 9 },
  { id: "che", name: "Chelsea", short: "CHE", lastSeasonPos: 10 },
  { id: "ful", name: "Fulham", short: "FUL", lastSeasonPos: 11 },
  { id: "new", name: "Newcastle United", short: "NEW", lastSeasonPos: 12 },
  { id: "eve", name: "Everton", short: "EVE", lastSeasonPos: 13 },
  { id: "lee", name: "Leeds United", short: "LEE", lastSeasonPos: 14 },
  { id: "cry", name: "Crystal Palace", short: "CRY", lastSeasonPos: 15 },
  { id: "nfo", name: "Nottingham Forest", short: "NFO", lastSeasonPos: 16 },
  { id: "tot", name: "Tottenham Hotspur", short: "TOT", lastSeasonPos: 17 },
  { id: "cov", name: "Coventry City", short: "COV", lastSeasonPos: null },
  { id: "ips", name: "Ipswich Town", short: "IPS", lastSeasonPos: null },
  { id: "hul", name: "Hull City", short: "HUL", lastSeasonPos: null },
];

// football-data.org returns full club names (e.g. "Arsenal FC") that don't
// always match ours exactly, so match on a normalized, alias-aware basis.
const ALIASES = {
  ars: ["arsenal"],
  mci: ["manchester city", "man city"],
  mun: ["manchester united", "man united", "man utd"],
  avl: ["aston villa"],
  liv: ["liverpool"],
  bou: ["afc bournemouth", "bournemouth"],
  sun: ["sunderland"],
  bha: ["brighton hove albion", "brighton & hove albion", "brighton"],
  bre: ["brentford"],
  che: ["chelsea"],
  ful: ["fulham"],
  new: ["newcastle united", "newcastle"],
  eve: ["everton"],
  lee: ["leeds united", "leeds"],
  cry: ["crystal palace"],
  nfo: ["nottingham forest", "nottm forest"],
  tot: ["tottenham hotspur", "tottenham", "spurs"],
  cov: ["coventry city", "coventry"],
  ips: ["ipswich town", "ipswich"],
  hul: ["hull city", "hull"],
};

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\bfc\b|\bafc\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapTeamNameToId(apiName) {
  const n = normalize(apiName);
  if (!n) return null;
  for (const [id, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      const a = normalize(alias);
      if (n === a || n.includes(a) || a.includes(n)) return id;
    }
  }
  return null;
}
