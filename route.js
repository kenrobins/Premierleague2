import { NextResponse } from "next/server";
import { mapTeamNameToId } from "../../../lib/teams";

// Cache for 5 minutes server-side so you don't burn through the free tier's
// 10 requests/minute limit if several people load the page at once.
export const revalidate = 300;

export async function GET() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    return NextResponse.json({ error: "FOOTBALL_DATA_KEY is not set" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED", {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `football-data.org returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const results = (data.matches || [])
      .filter((m) => m.score?.fullTime?.home != null && m.score?.fullTime?.away != null)
      .map((m) => ({
        gw: m.matchday,
        homeId: mapTeamNameToId(m.homeTeam?.name) || mapTeamNameToId(m.homeTeam?.shortName),
        awayId: mapTeamNameToId(m.awayTeam?.name) || mapTeamNameToId(m.awayTeam?.shortName),
        hg: m.score.fullTime.home,
        ag: m.score.fullTime.away,
        ts: m.utcDate,
      }))
      .filter((r) => r.homeId && r.awayId);

    return NextResponse.json({ results, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reach football-data.org" }, { status: 502 });
  }
}
