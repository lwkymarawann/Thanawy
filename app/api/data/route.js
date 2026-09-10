import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getData, setData, DEFAULT_DATA } from "../../../lib/kv";

function getRole() {
  return cookies().get("thanaweya_role")?.value || null;
}

function visible(item) {
  return item.visibleToMom !== false;
}

function filterForRole(data, role) {
  if (role === "admin" || role === "gf") return data;
  if (role === "mom") {
    const visibleSubjectIds = new Set(
      data.subjects.filter(visible).map((s) => s.id)
    );
    return {
      subjects: data.subjects.filter(visible),
      schedule: data.schedule.filter(
        (s) => visible(s) && visibleSubjectIds.has(s.subjectId)
      ),
      exams: data.exams.filter(
        (e) => visible(e) && visibleSubjectIds.has(e.subjectId)
      ),
      events: data.events.filter(visible),
    };
  }
  return DEFAULT_DATA;
}

export async function GET() {
  const role = getRole();
  if (!role) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const data = await getData();
  return NextResponse.json({ data: filterForRole(data, role), role });
}

export async function POST(req) {
  const role = getRole();
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Only the admin can make changes" },
      { status: 403 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const clean = {
    subjects: Array.isArray(body.subjects) ? body.subjects : [],
    schedule: Array.isArray(body.schedule) ? body.schedule : [],
    exams: Array.isArray(body.exams) ? body.exams : [],
    events: Array.isArray(body.events) ? body.events : [],
  };
  const saved = await setData(clean);
  return NextResponse.json({ data: saved });
}
