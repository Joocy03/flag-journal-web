import { useEffect, useMemo, useRef, useState } from "react";

const TODAY = new Date().toISOString().split("T")[0];
const PLAYER_OPTIONS = ["X", "Y", "C", "Z", "Q"];

const PLAYER_COLORS = {
  X: { bg: "#ef4444", stroke: "#ef4444", text: "#ffffff" },
  Y: { bg: "#3b82f6", stroke: "#3b82f6", text: "#ffffff" },
  C: { bg: "#22c55e", stroke: "#22c55e", text: "#ffffff" },
  Z: { bg: "#facc15", stroke: "#facc15", text: "#ffffff" },
  Q: { bg: "#a855f7", stroke: "#a855f7", text: "#ffffff" },
};

const styles = {
  shell: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflowX: "hidden",
    touchAction: "pan-y",
  },
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  app: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    background: "#0f172a",
    color: "#ffffff",
    padding: 12,
    borderBottom: "1px solid #1e293b",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  button: {
    border: "none",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  darkBtn: {
    background: "#334155",
    color: "#ffffff",
  },
  lightBtn: {
    background: "#ffffff",
    color: "#0f172a",
  },
  dateInput: {
    width: "100%",
    marginTop: 8,
    borderRadius: 12,
    border: "1px solid #475569",
    background: "#1e293b",
    color: "#ffffff",
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  section: {
    marginTop: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    background: "#f8fafc",
    padding: 12,
  },
  title: { fontSize: 14, fontWeight: 700, margin: 0 },
  sub: { fontSize: 12, color: "#64748b", margin: "4px 0 0" },
  fieldWrap: { width: "100%", maxWidth: 360, margin: "0 auto" },
  field: {
    position: "relative",
    width: "100%",
    aspectRatio: "0.62 / 1",
    overflow: "hidden",
    borderRadius: 20,
    border: "4px solid #ffffff",
    background: "#059669",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
  },
  journalCard: {
    marginTop: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    background: "#ffffff",
    padding: 16,
  },
  textarea: {
    width: "100%",
    height: 208,
    resize: "none",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 16,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },
  sheetBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 40,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "80vh",
    overflowY: "auto",
    background: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    boxShadow: "0 -8px 24px rgba(0,0,0,0.18)",
  },
  fieldItem: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: 14,
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 8,
  },
};

const createEntry = () => ({ journal: "", markers: [], routes: [] });
const createField = (id, title) => ({
  id,
  title,
  dateEntries: { [TODAY]: createEntry() },
});

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getRoutePoints(route) {
  if (Array.isArray(route)) return route;
  return route?.points ?? [];
}

function getRouteStroke(route) {
  if (Array.isArray(route)) return "#ffffff";
  return PLAYER_COLORS[route?.player]?.stroke ?? "#ffffff";
}

export default function App() {
  const initialFields = useMemo(
    () => [
      createField(1, "기본 필드"),
      createField(2, "패스 루트 훈련"),
      createField(3, "QB 훈련"),
    ],
    []
  );

  const [fields, setFields] = useState(() => {
    try {
      const saved = localStorage.getItem("flag-journal-fields");
      return saved ? JSON.parse(saved) : initialFields;
    } catch {
      return initialFields;
    }
  });
  const [selectedFieldId, setSelectedFieldId] = useState(() => {
    try {
      const saved = localStorage.getItem("flag-journal-selected-field-id");
      return saved ? JSON.parse(saved) : initialFields[0].id;
    } catch {
      return initialFields[0].id;
    }
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      return localStorage.getItem("flag-journal-selected-date") || TODAY;
    } catch {
      return TODAY;
    }
  });
  const [mode, setMode] = useState("marker");
  const [showFieldSheet, setShowFieldSheet] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [markerMenu, setMarkerMenu] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState([]);
  const [selectedRoutePlayer, setSelectedRoutePlayer] = useState("X");
  const [draggingMarkerId, setDraggingMarkerId] = useState(null);
  const [mobileView, setMobileView] = useState("sheet");
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const fieldRef = useRef(null);
  const suppressNextClickRef = useRef(false);

  const handleSwipeStart = (e) => {
    const x = e.touches?.[0]?.clientX;
    if (typeof x === "number") {
      setTouchStartX(x);
      setTouchEndX(null);
    }
  };

  const handleSwipeMove = (e) => {
    const x = e.touches?.[0]?.clientX;
    if (typeof x === "number") setTouchEndX(x);
  };

  const handleSwipeEnd = () => {
    if (touchStartX == null || touchEndX == null) return;
    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) setMobileView("journal");
    else setMobileView("field");
  };

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0];
  const selectedEntry = selectedField?.dateEntries?.[selectedDate] ?? createEntry();

  useEffect(() => {
    try {
      localStorage.setItem("flag-journal-fields", JSON.stringify(fields));
    } catch {}
  }, [fields]);

  useEffect(() => {
    try {
      localStorage.setItem("flag-journal-selected-field-id", JSON.stringify(selectedFieldId));
    } catch {}
  }, [selectedFieldId]);

  useEffect(() => {
    try {
      localStorage.setItem("flag-journal-selected-date", selectedDate);
    } catch {}
  }, [selectedDate]);

  const updateField = (id, updater) => {
    setFields((prev) => prev.map((field) => (field.id === id ? updater(field) : field)));
  };

  const ensureDateEntry = (field, dateKey) => ({
    ...field,
    dateEntries: {
      ...field.dateEntries,
      [dateKey]: field.dateEntries?.[dateKey] ?? createEntry(),
    },
  });

  const updateSelectedEntry = (updater) => {
    updateField(selectedField.id, (field) => {
      const ensured = ensureDateEntry(field, selectedDate);
      return {
        ...ensured,
        dateEntries: {
          ...ensured.dateEntries,
          [selectedDate]: updater(ensured.dateEntries[selectedDate]),
        },
      };
    });
  };

  const handleDateChange = (dateKey) => {
    setSelectedDate(dateKey);
    updateField(selectedField.id, (field) => ensureDateEntry(field, dateKey));
  };

  const clamp = (value) => Math.min(Math.max(value, 3), 97);

  const getPos = (event) => {
    if (!fieldRef.current) return { x: 50, y: 50 };
    const rect = fieldRef.current.getBoundingClientRect();
    const point = event.touches?.[0] ?? event.changedTouches?.[0] ?? event;
    return {
      x: clamp(((point.clientX - rect.left) / rect.width) * 100),
      y: clamp(((point.clientY - rect.top) / rect.height) * 100),
    };
  };

  const addField = () => {
    const title = newFieldTitle.trim();
    if (!title) return;
    const nextId = Date.now();
    const nextField = createField(nextId, title);
    setFields((prev) => [...prev, nextField]);
    setSelectedFieldId(nextId);
    setNewFieldTitle("");
    setShowAddInput(false);
    setShowFieldSheet(false);
    setMobileView("field");
  };

  const addMarker = (label) => {
    if (!markerMenu) return;
    const newMarker = { id: Date.now(), label, x: markerMenu.x, y: markerMenu.y };
    updateSelectedEntry((entry) => ({ ...entry, markers: [...entry.markers, newMarker] }));
    setMarkerMenu(null);
  };

  const removeMarker = (id) => {
    updateSelectedEntry((entry) => ({
      ...entry,
      markers: entry.markers.filter((marker) => marker.id !== id),
    }));
  };

  const handleFieldClick = (event) => {
    if (mode !== "marker") return;
    if (drawing || draggingMarkerId) return;
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    const pos = getPos(event);
    if (markerMenu) {
      setMarkerMenu(null);
      return;
    }
    setMarkerMenu(pos);
  };

  const startMarkerDrag = (event, markerId) => {
    if (mode !== "marker") return;
    event.preventDefault();
    event.stopPropagation();
    setMarkerMenu(null);
    setDraggingMarkerId(markerId);
    suppressNextClickRef.current = true;
  };

  const handlePointerDown = (event) => {
    if (mode !== "draw") return;
    const pos = getPos(event);

    let nearestPlayer = selectedRoutePlayer;
    let minDistance = Infinity;
    selectedEntry.markers.forEach((marker) => {
      const dx = marker.x - pos.x;
      const dy = marker.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance && distance < 8) {
        minDistance = distance;
        nearestPlayer = marker.label;
      }
    });

    setSelectedRoutePlayer(nearestPlayer);
    setDrawing(true);
    setCurrentRoute([pos]);
    setMarkerMenu(null);
  };

  const handlePointerMove = (event) => {
    if (draggingMarkerId) {
      const pos = getPos(event);
      updateSelectedEntry((entry) => ({
        ...entry,
        markers: entry.markers.map((marker) =>
          marker.id === draggingMarkerId ? { ...marker, x: pos.x, y: pos.y } : marker
        ),
      }));
      return;
    }

    if (!drawing) return;
    const pos = getPos(event);
    setCurrentRoute((prev) => [...prev, pos]);
  };

  const finishInteraction = () => {
    if (draggingMarkerId) {
      setDraggingMarkerId(null);
      requestAnimationFrame(() => {
        suppressNextClickRef.current = false;
      });
      return;
    }

    if (drawing && currentRoute.length > 1) {
      const newRoute = {
        id: Date.now(),
        player: selectedRoutePlayer,
        points: currentRoute,
      };
      updateSelectedEntry((entry) => ({ ...entry, routes: [...entry.routes, newRoute] }));
    }

    setDrawing(false);
    setCurrentRoute([]);
  };

  const undoLastRoute = () => {
    if (!selectedEntry.routes.length) return;
    updateSelectedEntry((entry) => ({ ...entry, routes: entry.routes.slice(0, -1) }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.row}>
            <button style={{ ...styles.button, ...styles.darkBtn }} onClick={() => setShowFieldSheet(true)}>
              필드
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ ...styles.button, ...(mode === "marker" ? styles.lightBtn : styles.darkBtn) }}
                onClick={() => {
                  setMode("marker");
                  setMarkerMenu(null);
                }}
              >
                📍
              </button>
              <button
                style={{ ...styles.button, ...(mode === "draw" ? styles.lightBtn : styles.darkBtn) }}
                onClick={() => {
                  setMode("draw");
                  setMarkerMenu(null);
                }}
              >
                ✏️
              </button>
            </div>
          </div>

          <div style={{ ...styles.row, marginTop: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{selectedField.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cbd5e1" }}>{formatDateLabel(selectedDate)}</p>
            </div>
            <button style={{ ...styles.button, ...styles.lightBtn, padding: "8px 12px", fontSize: 12 }} onClick={undoLastRoute}>
              Undo
            </button>
          </div>

          <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} style={styles.dateInput} />
        </header>

        {mobileView === "sheet" ? (
        <main style={{ padding: 12, paddingBottom: 24, overflowX: "hidden" }}>
          </section>
        ) : (
          <section style={styles.journalCard}>
            <div style={{ ...styles.row, alignItems: "center", marginBottom: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>훈련 일기</h2>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>우측으로 밀면 필드 화면</p>
              </div>
              <button style={{ ...styles.button, background: "#0f172a", color: "white", padding: "8px 12px", fontSize: 12 }} onClick={() => setMobileView("field")}>필드 보기</button>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>필드 선택</h2>
            <p style={{ margin: "4px 0 12px", fontSize: 14, color: "#64748b" }}>먼저 필드를 고른 뒤 좌우로 넘겨 필드와 일기를 확인해.</p>
            <div>
              {fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => {
                    setSelectedFieldId(field.id);
                    setMobileView("field");
                  }}
                  style={{
                    ...styles.fieldItem,
                    background: field.id === selectedFieldId ? "#0f172a" : "#ffffff",
                    color: field.id === selectedFieldId ? "#ffffff" : "#0f172a",
                    borderColor: field.id === selectedFieldId ? "#0f172a" : "#cbd5e1",
                  }}
                >
                  {field.title}
                </button>
              ))}
            </div>
            <button style={{ ...styles.button, background: "#0f172a", color: "white", width: "100%", marginTop: 8 }} onClick={() => setShowAddInput((v) => !v)}>
              + 필드 추가
            </button>
            {showAddInput && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={newFieldTitle}
                  onChange={(e) => setNewFieldTitle(e.target.value)}
                  placeholder="필드 이름"
                  style={{ flex: 1, borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
                />
                <button style={{ ...styles.button, background: "#0f172a", color: "white", fontSize: 12 }} onClick={addField}>
                  생성
                </button>
              </div>
            )}
          </section>
        </section>
        )}
        </main>
      ) : (
        <main style={{ padding: 12, paddingBottom: 24, overflowX: "hidden" }} onTouchStart={handleSwipeStart} onTouchMove={handleSwipeMove} onTouchEnd={handleSwipeEnd}>
          {mobileView === "field" ? (
          <section style={styles.section}>
            <div style={{ ...styles.row, alignItems: "center", marginBottom: 10 }}>
              <div>
                <h2 style={styles.title}>필드</h2>
                <p style={styles.sub}>좌측으로 밀면 일기 화면</p>
              </div>
              <button style={{ ...styles.button, background: "#0f172a", color: "white", padding: "8px 12px", fontSize: 12 }} onClick={() => setMobileView("sheet")}>필드 목록</button>
            </div>
            <h2 style={styles.title}>필드</h2>
            <p style={styles.sub}>아이폰 세로 화면 기준</p>

            <div style={styles.fieldWrap}>
              <div
                ref={fieldRef}
                style={styles.field}
                onClick={handleFieldClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishInteraction}
                onPointerCancel={finishInteraction}
                onPointerLeave={finishInteraction}
              >
                <div style={{ position: "absolute", insetInline: 0, top: 0, height: "10%", borderBottom: "4px solid rgba(255,255,255,0.9)", background: "rgba(16,185,129,0.55)" }} />
                <div style={{ position: "absolute", insetInline: 0, bottom: 0, height: "10%", borderTop: "4px solid rgba(255,255,255,0.9)", background: "rgba(16,185,129,0.55)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 4, transform: "translateY(-50%)", background: "rgba(255,255,255,0.95)" }} />

                {[5, 10, 15, 20, 25, 30, 35, 40, 45].map((yard) => (
                  <div
                    key={yard}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 2,
                      top: `${(yard / 50) * 80 + 10}%`,
                      background: "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}

                <div style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", color: "#047857", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                  END ZONE
                </div>
                <div style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", color: "#047857", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                  END ZONE
                </div>

                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {selectedEntry.routes.map((route, i) => {
                    const stroke = getRouteStroke(route);
                    const points = getRoutePoints(route);
                    const lastPoint = points[points.length - 1];
                    return (
                      <g key={Array.isArray(route) ? `legacy-${i}` : route.id}>
                        <polyline
                          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                          stroke={stroke}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        {lastPoint ? <ellipse cx={lastPoint.x} cy={lastPoint.y} rx="0.79" ry="0.48" fill={stroke} /> : null}
                      </g>
                    );
                  })}

                  {drawing && currentRoute.length > 1 ? (
                    <g>
                      <polyline
                        points={currentRoute.map((p) => `${p.x},${p.y}`).join(" ")}
                        stroke={PLAYER_COLORS[selectedRoutePlayer].stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                      <ellipse
                        cx={currentRoute[currentRoute.length - 1].x}
                        cy={currentRoute[currentRoute.length - 1].y}
                        rx="0.79"
                        ry="0.48"
                        fill={PLAYER_COLORS[selectedRoutePlayer].stroke}
                      />
                    </g>
                  ) : null}
                </svg>

                {selectedEntry.markers.map((marker) => {
                  const color = PLAYER_COLORS[marker.label];
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      onPointerDown={(event) => startMarkerDrag(event, marker.id)}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        removeMarker(marker.id);
                      }}
                      style={{
                        position: "absolute",
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        transform: "translate(-50%, -50%)",
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: "2px solid white",
                        background: color.bg,
                        color: color.text,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        cursor: "pointer",
                        touchAction: "none",
                      }}
                    >
                      {marker.label}
                    </button>
                  );
                })}

                {markerMenu && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${markerMenu.x}%`,
                      top: `${markerMenu.y}%`,
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      gap: 6,
                      background: "white",
                      padding: 8,
                      borderRadius: 16,
                      boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
                    }}
                  >
                    {PLAYER_OPTIONS.map((player) => {
                      const color = PLAYER_COLORS[player];
                      return (
                        <button
                          key={player}
                          type="button"
                          onClick={() => addMarker(player)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            border: "none",
                            background: color.bg,
                            color: color.text,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {player}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section style={styles.journalCard}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>훈련 일기</h2>
            <p style={{ margin: "4px 0 12px", fontSize: 14, color: "#64748b" }}>날짜별로 따로 저장돼.</p>
            <textarea
              value={selectedEntry.journal}
              onChange={(e) => updateSelectedEntry((entry) => ({ ...entry, journal: e.target.value }))}
              placeholder="훈련 내용을 기록하세요"
              style={styles.textarea}
            />
          </section>
        </main>

        {showFieldSheet && (
          <div style={styles.sheetBackdrop} onClick={() => setShowFieldSheet(false)}>
            <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 48, height: 6, borderRadius: 999, background: "#cbd5e1", margin: "0 auto 16px" }} />
              <div style={styles.row}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>필드 목록</h2>
                <button style={{ ...styles.button, background: "#0f172a", color: "white", fontSize: 14 }} onClick={() => setShowAddInput((v) => !v)}>
                  + 필드 추가
                </button>
              </div>

              {showAddInput && (
                <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12 }}>
                  <input
                    value={newFieldTitle}
                    onChange={(e) => setNewFieldTitle(e.target.value)}
                    placeholder="필드 이름"
                    style={{ flex: 1, borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px" }}
                  />
                  <button style={{ ...styles.button, background: "#0f172a", color: "white", fontSize: 12 }} onClick={addField}>
                    생성
                  </button>
                </div>
              )}

              <div>
                {fields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => {
                      setSelectedFieldId(field.id);
                      setShowFieldSheet(false);
                    }}
                    style={{
                      ...styles.fieldItem,
                      background: field.id === selectedFieldId ? "#0f172a" : "#ffffff",
                      color: field.id === selectedFieldId ? "#ffffff" : "#0f172a",
                      borderColor: field.id === selectedFieldId ? "#0f172a" : "#cbd5e1",
                    }}
                  >
                    {field.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
