"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TEAMS } from "../lib/teams";
import { computeActualTable, seasonScore, zoneColor, zoneLabel, ordinalSuffix } from "../lib/scoring";
import { savePrediction, loadPredictions } from "../lib/supabase";

const C = {
  pitch: "#0B3D2E",
  pitchDeep: "#082B20",
  pitchLine: "#1F6B4F",
  chalk: "#F4F2E9",
  ink: "#101915",
  inkSoft: "#4B5A52",
  gold: "#C9A227",
  goldSoft: "#E7D8A0",
  europa: "#3E7CB1",
  red: "#A8321E",
  card: "#FFFFFF",
  line: "#DCD9CB",
};

export default function Home() {
  const teamById = useMemo(() => Object.fromEntries(TEAMS.map((t) => [t.id, t])), []);
  const [tab, setTab] = useState("predict");
  const [predictionOrder, setPredictionOrder] = useState(TEAMS.map((t) => t.id));

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchError, setMatchError] = useState(null);

  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true);
    setMatchError(null);
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatches(data.results || []);
    } catch (e) {
      setMatchError("Couldn't load live results — check FOOTBALL_DATA_KEY in your .env.local.");
    }
    setLoadingMatches(false);
  }, []);

  const loadLeaders = useCallback(async () => {
    setLoadingLeaders(true);
    try {
      setLeaders(await loadPredictions());
    } catch (e) {
      setLeaders([]);
    }
    setLoadingLeaders(false);
  }, []);

  useEffect(() => {
    fetchMatches();
    loadLeaders();
  }, [fetchMatches, loadLeaders]);

  const actualTable = useMemo(() => computeActualTable(TEAMS, matches), [matches]);
  const currentGw = matches.reduce((m, x) => Math.max(m, x.gw || 0), 0);
  const actualPosById = useMemo(() => {
    const m = {};
    actualTable.forEach((row, idx) => (m[row.id] = idx + 1));
    return m;
  }, [actualTable]);

  const moveTeam = (index, dir) => {
    setPredictionOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const resetPrediction = () => setPredictionOrder(TEAMS.map((t) => t.id));

  const myScore = useMemo(() => seasonScore(predictionOrder, TEAMS, matches), [predictionOrder, matches]);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await savePrediction({
        nickname: nickname.trim(),
        order: predictionOrder,
        champion: teamById[predictionOrder[0]].name,
        relegated: predictionOrder.slice(17, 20).map((id) => teamById[id].name),
      });
      setSaveMsg("Saved!");
      loadLeaders();
    } catch (e) {
      setSaveMsg("Couldn't save — check your Supabase setup in .env.local.");
    }
    setSaving(false);
  };

  const leaderboard = useMemo(() => {
    return leaders
      .map((f) => {
        const s = seasonScore(f.order || [], TEAMS, matches);
        return { ...f, total: s.total, gwCount: s.gwCount };
      })
      .sort((a, b) => b.total - a.total);
  }, [leaders, matches]);

  const tabBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1,
        padding: "10px 6px",
        background: tab === key ? C.pitch : "transparent",
        color: tab === key ? C.chalk : C.inkSoft,
        border: "none",
        borderRadius: 8,
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.pitchDeep} 0%, ${C.pitch} 60%, ${C.pitchLine} 130%)`, padding: "24px 16px 20px" }}>
        <div style={{ fontFamily: "Inter", fontSize: 11, fontWeight: 700, color: C.goldSoft, letterSpacing: 1.5, textTransform: "uppercase" }}>
          2026-27 Season · Live from football-data.org
        </div>
        <div style={{ fontFamily: "Teko", fontSize: 38, color: C.chalk, fontWeight: 600, marginTop: 2 }}>POSITION PREDICTOR</div>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: "rgba(244,242,233,0.75)", marginTop: 6, maxWidth: 480 }}>
          {loadingMatches
            ? "Loading live results…"
            : matchError
            ? matchError
            : currentGw > 0
            ? `Live table through gameweek ${currentGw} · your season score: ${myScore.total} pts.`
            : "No finished matches yet — the live table will populate once the season kicks off."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "12px 12px 0" }}>
        {tabBtn("predict", "My Order")}
        {tabBtn("leaderboard", "Leaderboard")}
      </div>

      <div style={{ padding: "12px 12px 40px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "predict" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 2px 10px" }}>
              <span style={{ fontFamily: "Inter", fontSize: 12, color: C.inkSoft }}>Set your predicted final order</span>
              <button
                onClick={resetPrediction}
                style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "Inter", fontWeight: 600, color: C.inkSoft, cursor: "pointer" }}
              >
                Reset
              </button>
            </div>

            {predictionOrder.map((id, idx) => {
              const pos = idx + 1;
              const team = teamById[id];
              const actPos = actualPosById[id];
              const delta = currentGw > 0 && actPos ? pos - actPos : null;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 8px 8px 10px", marginBottom: 6 }}>
                  <div style={{ width: 4, alignSelf: "stretch", background: zoneColor(pos, C), borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ fontFamily: "Teko", fontSize: 19, color: C.ink, width: 22, fontWeight: 600, flexShrink: 0 }}>{pos}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: C.ink }}>{team.name}</div>
                    <div style={{ fontFamily: "Inter", fontSize: 10, color: C.inkSoft }}>
                      {zoneLabel(pos) || (team.lastSeasonPos ? `${team.lastSeasonPos}${ordinalSuffix(team.lastSeasonPos)} last season` : "Promoted")}
                      {currentGw > 0 && actPos ? ` · actually ${actPos}${ordinalSuffix(actPos)}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveTeam(idx, -1)} disabled={idx === 0} style={{ width: 26, height: 22, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1 }}>
                      ▲
                    </button>
                    <button
                      onClick={() => moveTeam(idx, 1)}
                      disabled={idx === predictionOrder.length - 1}
                      style={{ width: 26, height: 22, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", cursor: idx === predictionOrder.length - 1 ? "default" : "pointer", opacity: idx === predictionOrder.length - 1 ? 0.4 : 1 }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Lock in your prediction</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your name"
                  style={{ flex: 1, padding: 9, borderRadius: 7, border: `1px solid ${C.line}` }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !nickname.trim()}
                  style={{ padding: "9px 14px", borderRadius: 7, border: "none", background: C.pitch, color: C.chalk, fontFamily: "Inter", fontWeight: 700, fontSize: 12, cursor: nickname.trim() ? "pointer" : "default", opacity: nickname.trim() ? 1 : 0.5 }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
              {saveMsg && <div style={{ fontFamily: "Inter", fontSize: 11, color: C.inkSoft, marginTop: 8 }}>{saveMsg}</div>}
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13 }}>Live table {currentGw > 0 ? `— through GW${currentGw}` : ""}</span>
              <button onClick={fetchMatches} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>
                Refresh
              </button>
            </div>
            <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 18 }}>
              {actualTable.map((row, idx) => {
                const pos = idx + 1;
                return (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: pos < 20 ? `1px solid ${C.line}` : "none", gap: 10 }}>
                    <div style={{ width: 4, alignSelf: "stretch", background: zoneColor(pos, C), borderRadius: 2 }} />
                    <div style={{ fontFamily: "Teko", fontSize: 16, width: 20, fontWeight: 600 }}>{pos}</div>
                    <div style={{ flex: 1, fontFamily: "Inter", fontSize: 12.5, fontWeight: 700 }}>{row.name}</div>
                    <div style={{ fontFamily: "Inter", fontSize: 11, color: C.inkSoft }}>
                      {row.played}gp · {row.pts}pts
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Season leaderboard</div>
            {loadingLeaders && <div style={{ fontFamily: "Inter", fontSize: 12, color: C.inkSoft }}>Loading…</div>}
            {!loadingLeaders && leaderboard.length === 0 && <div style={{ fontFamily: "Inter", fontSize: 12, color: C.inkSoft }}>No one's saved a prediction yet.</div>}
            {leaderboard.map((f, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: i === 0 ? C.gold : "#EDEBE1", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Teko", fontSize: 14, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13 }}>{f.nickname}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 10.5, color: C.inkSoft }}>
                    Champion pick: {f.champion} · {f.gwCount} GW scored
                  </div>
                </div>
                <div style={{ fontFamily: "Teko", fontSize: 20, fontWeight: 600 }}>{f.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
