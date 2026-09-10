"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { percentage, letterGrade, subjectAverage } from "../lib/grading";

const ROLE_LABEL = { admin: "Me", gf: "Girlfriend", mom: "Mom" };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TABS = [
  { id: "calendar", label: "Calendar" },
  { id: "schedule", label: "Class schedule" },
  { id: "grades", label: "Grades" },
];

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "id-" + Math.random().toString(36).slice(2, 10);
}

function gradeBand(pct) {
  const l = letterGrade(pct);

  if (l.startsWith("A")) return "A";
  if (l.startsWith("B")) return "B";
  if (l.startsWith("C")) return "C";
  if (l === "D") return "D";

  return "F";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardClient({ role }) {
  const router = useRouter();
  const isAdmin = role === "admin";

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/data")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/");
          return null;
        }

        return res.json();
      })
      .then((body) => {
        if (body) {
          setData(body.data);
        }
      })
      .catch(() => setError("Couldn't load data."))
      .finally(() => setLoading(false));
  }, [router]);

  async function save(next) {
    setData(next);

    if (!isAdmin) return;

    setSaving(true);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });

      const body = await res.json();

      if (res.ok) {
        setData(body.data);
      } else {
        setError(body.error || "Couldn't save.");
      }
    } catch {
      setError("Couldn't save — check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  const subjectsById = useMemo(() => {
    const m = {};

    (data?.subjects || []).forEach((s) => {
      m[s.id] = s;
    });

    return m;
  }, [data]);

  if (loading) {
    return <div className="login-shell muted">Loading…</div>;
  }

  if (error && !data) {
    return <div className="login-shell muted">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">Thanaweya</div>

        <nav className="rail-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"rail-link" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}

          {isAdmin && (
            <button
              className={"rail-link" + (tab === "admin" ? " active" : "")}
              onClick={() => setTab("admin")}
            >
              Subjects & access
            </button>
          )}
        </nav>

        <div className="rail-foot">
          <span className="role-chip">
            <span className="role-dot" />
            {ROLE_LABEL[role]}
            {saving ? " · saving…" : ""}
          </span>

          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        {tab === "calendar" && (
          <CalendarTab
            data={data}
            save={save}
            isAdmin={isAdmin}
            subjectsById={subjectsById}
          />
        )}

        {tab === "schedule" && (
          <ScheduleTab
            data={data}
            save={save}
            isAdmin={isAdmin}
          />
        )}

        {tab === "grades" && (
          <GradesTab
            data={data}
            save={save}
            isAdmin={isAdmin}
          />
        )}

        {tab === "admin" && isAdmin && (
          <AdminTab
            data={data}
            save={save}
          />
        )}
      </main>
    </div>
  );
}

function CalendarTab({ data, save, isAdmin, subjectsById }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();

    return {
      y: d.getFullYear(),
      m: d.getMonth(),
    };
  });

  const [selected, setSelected] = useState(todayStr());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(
    cursor.y,
    cursor.m + 1,
    0
  ).getDate();

  const prevDays = new Date(
    cursor.y,
    cursor.m,
    0
  ).getDate();

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({
      day: prevDays - startOffset + 1 + i,
      muted: true,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${cursor.y}-${String(cursor.m + 1).padStart(
      2,
      "0"
    )}-${String(d).padStart(2, "0")}`;

    cells.push({
      day: d,
      dateStr,
      muted: false,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      day: cells.length,
      muted: true,
    });
  }

  function itemsForDate(dateStr) {
    if (!dateStr) {
      return {
        exams: [],
        events: [],
        classes: [],
      };
    }

    const dow = new Date(
      dateStr + "T00:00:00"
    ).getDay();

    return {
      exams: data.exams.filter(
        (e) => e.date === dateStr
      ),
      events: data.events.filter(
        (e) => e.date === dateStr
      ),
      classes: data.schedule.filter(
        (s) => Number(s.day) === dow
      ),
    };
  }

  const selectedItems = itemsForDate(selected);

  function monthLabel() {
    return new Date(
      cursor.y,
      cursor.m,
      1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function shiftMonth(delta) {
    let m = cursor.m + delta;
    let y = cursor.y;

    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }

    setCursor({ y, m });
  }

  function addEvent(ev) {
    save({
      ...data,
      events: [
        ...data.events,
        {
          id: uid(),
          visibleToMom: true,
          ...ev,
        },
      ],
    });
  }

  function removeEvent(id) {
    save({
      ...data,
      events: data.events.filter(
        (e) => e.id !== id
      ),
    });
  }

  function toggleEventVisible(id) {
    save({
      ...data,
      events: data.events.map((e) =>
        e.id === id
          ? {
              ...e,
              visibleToMom: !e.visibleToMom,
            }
          : e
      ),
    });
  }

  return (
    <>
      <div className="main-header">
        <div>
          <h2>Calendar</h2>
          <div className="main-sub">
            Classes, exams and events in one place.
          </div>
        </div>
      </div>

      <div className="cal-head">
        <button
          className="btn btn-sm"
          onClick={() => shiftMonth(-1)}
        >
          ← Prev
        </button>

        <strong style={{ fontFamily: "var(--font-serif)" }}>
          {monthLabel()}
        </strong>

        <button
          className="btn btn-sm"
          onClick={() => shiftMonth(1)}
        >
          Next →
        </button>
      </div>

      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}

        {cells.map((c, i) => {
          const items = itemsForDate(c.dateStr);
          const isToday =
            c.dateStr === todayStr();
          const isSelected =
            c.dateStr === selected;

          return (
            <div
              key={i}
              className={
                "cal-cell" +
                (c.muted ? " muted" : "") +
                (isToday ? " cal-today" : "") +
                (isSelected ? " selected" : "")
              }
              onClick={() =>
                c.dateStr &&
                setSelected(c.dateStr)
              }
            >
              <span className="cal-daynum">
                {c.day}
              </span>

              {!c.muted && (
                <span className="cal-dot-row">
                  {items.classes
                    .slice(0, 4)
                    .map((_, idx) => (
                      <span
                        className="cal-dot dot-class"
                        key={"c" + idx}
                      />
                    ))}

                  {items.exams.map((_, idx) => (
                    <span
                      className="cal-dot dot-exam"
                      key={"e" + idx}
                    />
                  ))}

                  {items.events.map((_, idx) => (
                    <span
                      className="cal-dot dot-event"
                      key={"v" + idx}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="day-panel">
        <div
          className="main-header"
          style={{ marginBottom: 10 }}
        >
          <h3 style={{ fontSize: 16 }}>
            {new Date(
              selected + "T00:00:00"
            ).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {isAdmin && (
            <button
              className="btn btn-sm"
              onClick={() =>
                setShowQuickAdd((s) => !s)
              }
            >
              {showQuickAdd
                ? "Close"
                : "+ Add event"}
            </button>
          )}
        </div>

        {isAdmin && showQuickAdd && (
          <QuickEventForm
            date={selected}
            onAdd={(ev) => {
              addEvent(ev);
              setShowQuickAdd(false);
            }}
          />
        )}

        <div className="ledger">
          <div className="ledger-row head">
            <span className="col-grow">
              What
            </span>

            <span
              className="col"
              style={{ width: 90 }}
            >
              Type
            </span>

            {isAdmin && (
              <span
                className="col"
                style={{ width: 130 }}
              >
                Mom sees
              </span>
            )}
          </div>

          {selectedItems.classes.length === 0 &&
          selectedItems.exams.length === 0 &&
          selectedItems.events.length === 0 ? (
            <div className="ledger-empty">
              Nothing scheduled this day.
            </div>
          ) : (
            <>
              {selectedItems.classes.map((s) => (
                <div
                  className="ledger-row"
                  key={s.id}
                >
                  <span className="col-grow">
                    {subjectsById[s.subjectId]?.name ||
                      "Subject"}{" "}
                    — {s.startTime}
                    {s.endTime
                      ? `–${s.endTime}`
                      : ""}{" "}
                    {s.room
                      ? `· ${s.room}`
                      : ""}
                  </span>

                  <span className="badge badge-muted">
                    Class
                  </span>

                  {isAdmin && (
                    <span style={{ width: 130 }} />
                  )}
                </div>
              ))}

              {selectedItems.exams.map((e) => {
                const subj =
                  subjectsById[e.subjectId];
                const pct = percentage(
                  e.score,
                  e.maxScore
                );

                return (
                  <div
                    className="ledger-row"
                    key={e.id}
                  >
                    <span className="col-grow">
                      {subj?.name || "Subject"} —{" "}
                      {e.title}

                      {pct !== null && (
                        <span className="pct">
                          {" "}
                          · {pct}% (
                          {letterGrade(pct)})
                        </span>
                      )}
                    </span>

                    <span className="badge badge-muted">
                      Exam
                    </span>

                    {isAdmin && (
                      <span
                        style={{ width: 130 }}
                      />
                    )}
                  </div>
                );
              })}

              {selectedItems.events.map((e) => (
                <div
                  className="ledger-row"
                  key={e.id}
                >
                  <span className="col-grow">
                    {e.title}
                    {e.time
                      ? ` — ${e.time}`
                      : ""}
                  </span>

                  <span className="badge badge-muted">
                    Event
                  </span>

                  {isAdmin && (
                    <span
                      style={{
                        width: 130,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <MomToggle
                        checked={e.visibleToMom}
                        onChange={() =>
                          toggleEventVisible(
                            e.id
                          )
                        }
                      />

                      <button
                        className="btn-ghost btn-sm"
                        onClick={() =>
                          removeEvent(e.id)
                        }
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function QuickEventForm({ date, onAdd }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  return (
    <div className="inline-form">
      <div className="form-row">
        <div
          className="field"
          style={{ flex: 1 }}
        >
          <label>Event title</label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="e.g. Parent meeting"
          />
        </div>

        <div className="field">
          <label>Time (optional)</label>

          <input
            type="time"
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
          />
        </div>

        <button
          className="btn btn-primary"
          disabled={!title.trim()}
          onClick={() =>
            onAdd({
              title: title.trim(),
              time,
              date,
              visibleToMom: true,
            })
          }
        >
          Add to {date}
        </button>
      </div>
    </div>
  );
}

function MomToggle({ checked, onChange }) {
  return (
    <label
      className="toggle"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <input
        type="checkbox"
        checked={checked !== false}
        onChange={onChange}
      />

      <span className="toggle-track" />
    </label>
  );
}

function ScheduleTab({ data, save, isAdmin }) {
  const [showForm, setShowForm] =
    useState(false);

  function addItem(item) {
    save({
      ...data,
      schedule: [
        ...data.schedule,
        {
          id: uid(),
          visibleToMom: true,
          ...item,
        },
      ],
    });
  }

  function removeItem(id) {
    save({
      ...data,
      schedule: data.schedule.filter(
        (s) => s.id !== id
      ),
    });
  }

  function toggleVisible(id) {
    save({
      ...data,
      schedule: data.schedule.map((s) =>
        s.id === id
          ? {
              ...s,
              visibleToMom:
                !s.visibleToMom,
            }
          : s
      ),
    });
  }

  const bySubject = (id) =>
    data.subjects.find(
      (s) => s.id === id
    );

  return (
    <>
      <div className="main-header">
        <div>
          <h2>Class schedule</h2>

          <div className="main-sub">
            Weekly recurring class times.
          </div>
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              setShowForm((s) => !s)
            }
          >
            {showForm
              ? "Close"
              : "+ Add class time"}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <ScheduleForm
          subjects={data.subjects}
          onAdd={(item) => {
            addItem(item);
            setShowForm(false);
          }}
        />
      )}

      {DAY_NAMES.map((dayName, dow) => {
        const items = data.schedule
          .filter(
            (s) => Number(s.day) === dow
          )
          .sort((a, b) =>
            (a.startTime || "").localeCompare(
              b.startTime || ""
            )
          );

        return (
          <div
            className="card"
            key={dow}
          >
            <div className="card-title">
              {dayName}
            </div>

            <div className="ledger">
              {items.length === 0 ? (
                <div className="ledger-empty">
                  No classes.
                </div>
              ) : (
                items.map((s) => {
                  const subj =
                    bySubject(s.subjectId);

                  return (
                    <div
                      className="ledger-row"
                      key={s.id}
                    >
                      <span
                        className="col"
                        style={{ width: 110 }}
                      >
                        {s.startTime}
                        {s.endTime
                          ? `–${s.endTime}`
                          : ""}
                      </span>

                      <span className="col-grow">
                        {subj?.name ||
                          "(subject removed)"}
                      </span>

                      <span
                        className="col muted"
                        style={{ width: 100 }}
                      >
                        {s.room || ""}
                      </span>

                      {isAdmin && (
                        <span
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <MomToggle
                            checked={
                              s.visibleToMom
                            }
                            onChange={() =>
                              toggleVisible(
                                s.id
                              )
                            }
                          />

                          <button
                            className="btn-ghost btn-sm"
                            onClick={() =>
                              removeItem(s.id)
                            }
                          >
                            ✕
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function ScheduleForm({ subjects, onAdd }) {
  const [subjectId, setSubjectId] =
    useState(subjects[0]?.id || "");
  const [day, setDay] = useState(0);
  const [startTime, setStartTime] =
    useState("");
  const [endTime, setEndTime] =
    useState("");
  const [room, setRoom] = useState("");

  if (subjects.length === 0) {
    return (
      <div className="inline-form muted">
        Add a subject first, from the
        "Subjects & access" tab.
      </div>
    );
  }

  return (
    <div className="inline-form">
      <div className="form-grid">
        <div className="field">
          <label>Subject</label>

          <select
            value={subjectId}
            onChange={(e) =>
              setSubjectId(e.target.value)
            }
          >
            {subjects.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Day</label>

          <select
            value={day}
            onChange={(e) =>
              setDay(Number(e.target.value))
            }
          >
            {DAY_NAMES.map((d, i) => (
              <option
                key={i}
                value={i}
              >
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Start time</label>

          <input
            type="time"
            value={startTime}
            onChange={(e) =>
              setStartTime(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>End time</label>

          <input
            type="time"
            value={endTime}
            onChange={(e) =>
              setEndTime(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Room (optional)</label>

          <input
            value={room}
            onChange={(e) =>
              setRoom(e.target.value)
            }
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 12 }}
        disabled={!subjectId || !startTime}
        onClick={() =>
          onAdd({
            subjectId,
            day,
            startTime,
            endTime,
            room,
          })
        }
      >
        Add class time
      </button>
    </div>
  );
}

function GradesTab({ data, save, isAdmin }) {
  const [openSubject, setOpenSubject] =
    useState(null);
  const [showForm, setShowForm] =
    useState(null);

  function addExam(subjectId, exam) {
    save({
      ...data,
      exams: [
        ...data.exams,
        {
          id: uid(),
          subjectId,
          visibleToMom: true,
          weight: 1,
          ...exam,
        },
      ],
    });
  }

  function updateExam(id, patch) {
    save({
      ...data,
      exams: data.exams.map((e) =>
        e.id === id
          ? { ...e, ...patch }
          : e
      ),
    });
  }

  function removeExam(id) {
    save({
      ...data,
      exams: data.exams.filter(
        (e) => e.id !== id
      ),
    });
  }

  if (data.subjects.length === 0) {
    return (
      <>
        <div className="main-header">
          <h2>Grades</h2>
        </div>

        <div className="empty-state">
          No subjects yet.{" "}
          {isAdmin
            ? 'Add one from "Subjects & access" to start tracking exams.'
            : "Ask your admin to add subjects."}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="main-header">
        <div>
          <h2>Grades</h2>

          <div className="main-sub">
            Percentage and letter grade are
            calculated automatically from
            each score.
          </div>
        </div>
      </div>

      {data.subjects.map((subj) => {
        const exams = data.exams
          .filter(
            (e) => e.subjectId === subj.id
          )
          .sort((a, b) =>
            (b.date || "").localeCompare(
              a.date || ""
            )
          );

        const avg =
          subjectAverage(exams);

        const isOpen =
          openSubject === subj.id;

        return (
          <div
            className="card"
            key={subj.id}
          >
            <div
              className="card-title"
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                cursor: "pointer",
              }}
              onClick={() =>
                setOpenSubject(
                  isOpen
                    ? null
                    : subj.id
                )
              }
            >
              <span>{subj.name}</span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {avg !== null ? (
                  <>
                    <span className="pct">
                      {avg}%
                    </span>

                    <span
                      className={`badge badge-grade-${gradeBand(
                        avg
                      )}`}
                    >
                      {letterGrade(avg)}
                    </span>
                  </>
                ) : (
                  <span className="badge badge-muted">
                    No scores yet
                  </span>
                )}
              </span>
            </div>

            {isOpen && (
              <>
                {isAdmin && (
                  <div
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        setShowForm(
                          showForm === subj.id
                            ? null
                            : subj.id
                        )
                      }
                    >
                      {showForm === subj.id
                        ? "Close"
                        : "+ Add exam"}
                    </button>
                  </div>
                )}

                {isAdmin &&
                  showForm === subj.id && (
                    <ExamForm
                      onAdd={(exam) => {
                        addExam(
                          subj.id,
                          exam
                        );
                        setShowForm(null);
                      }}
                    />
                  )}

                <div className="ledger">
                  <div className="ledger-row head">
                    <span
                      className="col"
                      style={{ width: 100 }}
                    >
                      Date
                    </span>

                    <span className="col-grow">
                      Exam
                    </span>

                    <span
                      className="col"
                      style={{ width: 90 }}
                    >
                      Score
                    </span>

                    <span
                      className="col"
                      style={{ width: 70 }}
                    >
                      %
                    </span>

                    <span
                      className="col"
                      style={{ width: 60 }}
                    >
                      Grade
                    </span>

                    {isAdmin && (
                      <span
                        className="col"
                        style={{ width: 90 }}
                      >
                        &nbsp;
                      </span>
                    )}
                  </div>

                  {exams.length === 0 ? (
                    <div className="ledger-empty">
                      No exams recorded for
                      this subject.
                    </div>
                  ) : (
                    exams.map((e) => {
                      const pct =
                        percentage(
                          e.score,
                          e.maxScore
                        );

                      return (
                        <ExamRow
                          key={e.id}
                          exam={e}
                          pct={pct}
                          isAdmin={isAdmin}
                          onUpdate={(patch) =>
                            updateExam(
                              e.id,
                              patch
                            )
                          }
                          onRemove={() =>
                            removeExam(
                              e.id
                            )
                          }
                        />
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function ExamRow({
  exam,
  pct,
  isAdmin,
  onUpdate,
  onRemove,
}) {
  const [editing, setEditing] =
    useState(false);

  const [score, setScore] = useState(
    exam.score ?? ""
  );

  const [maxScore, setMaxScore] =
    useState(exam.maxScore ?? "");

  if (editing) {
    return (
      <div className="ledger-row">
        <span
          className="col"
          style={{ width: 100 }}
        >
          {exam.date || "—"}
        </span>

        <span className="col-grow">
          {exam.title}
        </span>

        <span
          className="col"
          style={{
            width: 90,
            display: "flex",
            gap: 3,
          }}
        >
          <input
            style={{
              width: 40,
              padding: "3px 4px",
            }}
            value={score}
            onChange={(ev) =>
              setScore(ev.target.value)
            }
            placeholder="score"
          />

          /

          <input
            style={{
              width: 40,
              padding: "3px 4px",
            }}
            value={maxScore}
            onChange={(ev) =>
              setMaxScore(
                ev.target.value
              )
            }
            placeholder="max"
          />
        </span>

        <span
          className="col"
          style={{ width: 70 }}
        />

        <span
          className="col"
          style={{ width: 60 }}
        />

        <span
          style={{
            width: 90,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              onUpdate({
                score:
                  score === ""
                    ? null
                    : Number(score),
                maxScore:
                  maxScore === ""
                    ? null
                    : Number(maxScore),
              });

              setEditing(false);
            }}
          >
            Save
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="ledger-row">
      <span
        className="col"
        style={{ width: 100 }}
      >
        {exam.date || "—"}
      </span>

      <span className="col-grow">
        {exam.title}

        {exam.score === null ||
        exam.score === undefined ? (
          <span
            className="badge badge-muted"
            style={{ marginLeft: 8 }}
          >
            Upcoming
          </span>
        ) : null}
      </span>

      <span
        className="col"
        style={{ width: 90 }}
      >
        {exam.score !== null &&
        exam.score !== undefined
          ? `${exam.score}/${exam.maxScore}`
          : "—"}
      </span>

      <span
        className="col pct"
        style={{ width: 70 }}
      >
        {pct !== null
          ? `${pct}%`
          : "—"}
      </span>

      <span
        className="col"
        style={{ width: 60 }}
      >
        {pct !== null ? (
          <span
            className={`badge badge-grade-${gradeBand(
              pct
            )}`}
          >
            {letterGrade(pct)}
          </span>
        ) : (
          "—"
        )}
      </span>

      {isAdmin && (
        <span
          style={{
            width: 90,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <MomToggle
            checked={exam.visibleToMom}
            onChange={() =>
              onUpdate({
                visibleToMom:
                  !exam.visibleToMom,
              })
            }
          />

          <button
            className="btn-ghost btn-sm"
            onClick={() =>
              setEditing(true)
            }
          >
            ✎
          </button>

          <button
            className="btn-ghost btn-sm"
            onClick={onRemove}
          >
            ✕
          </button>
        </span>
      )}
    </div>
  );
}

function ExamForm({ onAdd }) {
  const [title, setTitle] =
    useState("");

  const [date, setDate] =
    useState(todayStr());

  const [maxScore, setMaxScore] =
    useState("100");

  const [score, setScore] =
    useState("");

  const [upcoming, setUpcoming] =
    useState(false);

  return (
    <div className="inline-form">
      <div className="form-grid">
        <div className="field">
          <label>Exam name</label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="e.g. Monthly test 1"
          />
        </div>

        <div className="field">
          <label>Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Max score</label>

          <input
            value={maxScore}
            onChange={(e) =>
              setMaxScore(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>
            Score (leave blank if upcoming)
          </label>

          <input
            value={score}
            disabled={upcoming}
            onChange={(e) =>
              setScore(e.target.value)
            }
            placeholder="e.g. 87"
          />
        </div>
      </div>

      <label
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          marginTop: 10,
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={upcoming}
          onChange={(e) => {
            setUpcoming(
              e.target.checked
            );

            if (e.target.checked) {
              setScore("");
            }
          }}
        />

        This is an upcoming exam
        (no score yet)
      </label>

      <button
        className="btn btn-primary"
        style={{ marginTop: 12 }}
        disabled={
          !title.trim() || !maxScore
        }
        onClick={() =>
          onAdd({
            title: title.trim(),
            date,
            maxScore: Number(maxScore),
            score:
              upcoming || score === ""
                ? null
                : Number(score),
          })
        }
      >
        Add exam
      </button>
    </div>
  );
}

function AdminTab({ data, save }) {
  const [name, setName] =
    useState("");

  function addSubject() {
    if (!name.trim()) return;

    save({
      ...data,
      subjects: [
        ...data.subjects,
        {
          id: uid(),
          name: name.trim(),
          visibleToMom: true,
        },
      ],
    });

    setName("");
  }

  function removeSubject(id) {
    save({
      ...data,
      subjects: data.subjects.filter(
        (s) => s.id !== id
      ),
      schedule: data.schedule.filter(
        (s) => s.subjectId !== id
      ),
      exams: data.exams.filter(
        (e) => e.subjectId !== id
      ),
    });
  }

  function toggleVisible(id) {
    save({
      ...data,
      subjects: data.subjects.map((s) =>
        s.id === id
          ? {
              ...s,
              visibleToMom:
                !s.visibleToMom,
            }
          : s
      ),
    });
  }

  return (
    <>
      <div className="main-header">
        <div>
          <h2>Subjects & access</h2>

          <div className="main-sub">
            Manage subjects and control what
            shows up on Mom's view. Turning a
            subject off hides its classes,
            exams and grades from her — the
            girlfriend's view is never
            restricted.
          </div>
        </div>
      </div>

      <div className="inline-form">
        <div className="form-row">
          <div
            className="field"
            style={{ flex: 1 }}
          >
            <label>
              New subject name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Pure Math"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                addSubject()
              }
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={addSubject}
            disabled={!name.trim()}
          >
            Add subject
          </button>
        </div>
      </div>

      <div className="ledger">
        <div className="ledger-row head">
          <span className="col-grow">
            Subject
          </span>

          <span
            className="col"
            style={{ width: 150 }}
          >
            Visible to Mom
          </span>

          <span
            className="col"
            style={{ width: 40 }}
          >
            &nbsp;
          </span>
        </div>

        {data.subjects.length === 0 ? (
          <div className="ledger-empty">
            No subjects yet — add one above.
          </div>
        ) : (
          data.subjects.map((s) => (
            <div
              className="ledger-row"
              key={s.id}
            >
              <span className="col-grow">
                {s.name}
              </span>

              <span style={{ width: 150 }}>
                <MomToggle
                  checked={s.visibleToMom}
                  onChange={() =>
                    toggleVisible(s.id)
                  }
                />
              </span>

              <button
                className="btn-ghost btn-sm"
                onClick={() =>
                  removeSubject(s.id)
                }
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
