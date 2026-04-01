import { useEffect, useMemo, useRef, useState } from "react";

const TODAY = new Date().toISOString().split("T")[0];
const PLAYER_OPTIONS = ["X", "Y", "C", "Z", "Q"];

const PLAYER_COLORS = {
  X: { bg: "#ef4444", stroke: "#ef4444", text: "#ffffff" },
  Y: { bg: "#3b82f6", stroke: "#3b82f6", text: "#ffffff" },
  C: { bg: "#22c55e", stroke: "#22c55e", text: "#ffffff" },
  Z: { bg: "#facc15", stroke: "#ffffff", text: "#ffffff" },
  Q: { bg: "#a855f7", stroke: "#a855f7", text: "#ffffff" },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
  },
  shell: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100vh",
    margin: "0 auto",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflowX: "hidden",
    position: "relative",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
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
    WebkitTapHighlightColor: "transparent",
  },
  darkBtn: { background: "#334155", color: "#ffffff" },
  lightBtn: { background: "#ffffff", color: "#0f172a" },
  dateInput: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    display: "block",
    marginTop: 8,
    borderRadius: 12,
    border: "1px solid #475569",
    background: "#1e293b",
    color: "#ffffff",
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
  },
  main: {
    padding: 12,
    paddingBottom: 24,
    overflowX: "hidden",
  },
  card: {
    marginTop: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    background: "#ffffff",
    padding: 16,
  },
  section: {
    marginTop: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    background: "#f8fafc",
    padding: 12,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  sub: { margin: "4px 0 12px", fontSize: 14, color: "#64748b" },
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
    touchAction: "none",
  },
  textarea: {
    width: "100%",
    height: 260,
    resize: "none",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: 16,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
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
    background: "#ffffff",
  },
  smallAction: {
    padding: "8px 10px",
    fontSize: 12,
    borderRadius: 10,
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

function clampMenuPosition(pos) {
  const menuWidth = 30;
  const menuHalf = menuWidth / 2;
  return {
    x: Math.min(Math.max(pos.x, menuHalf + 2), 100 - menuHalf - 2),
    y: Math.min(Math.max(pos.y, 8), 92),
  };
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
  const [mobileView, setMobileView] = useState("sheet");
  const [showAddInput, setShowAddInput] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState("");
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingFieldTitle, setEditingFieldTitle] = useState("");
  const [fieldActionMenuId, setFieldActionMenuId] = useState(null);
  const [markerMenu, setMarkerMenu] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState([]);
  const [selectedRoutePlayer, setSelectedRoutePlayer] = useState("X");
  const [draggingMarkerId, setDraggingMarkerId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  const fieldRef = useRef(null);
  const fieldPressTimerRef = useRef(null);
  const suppressNextClickRef = useRef(false);

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

  const handleSwipeStart = (e) => {
    const x = e.touches?.[0]?.clientX;
    const y = e.touches?.[0]?.clientY;
    if (typeof x === "number" && typeof y === "number") {
      setTouchStartX(x);
      setTouchStartY(y);
      setTouchEndX(null);
      setTouchEndY(null);
    }
  };

  const handleSwipeMove = (e) => {
    const x = e.touches?.[0]?.clientX;
    const y = e.touches?.[0]?.clientY;
    if (typeof x === "number" && typeof y === "number") {
      setTouchEndX(x);
      setTouchEndY(y);
    }
  };

  const handleSwipeEnd = () => {
    if (touchStartX == null || touchEndX == null || touchStartY == null || touchEndY == null) return;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    if (Math.abs(deltaX) < 50) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 0.8) return;
    if (deltaX > 0) setMobileView("journal");
    else setMobileView("field");
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
    setMobileView("field");
  };

  const startFieldPress = (fieldId) => {
    clearTimeout(fieldPressTimerRef.current);
    fieldPressTimerRef.current = setTimeout(() => {
      setFieldActionMenuId(fieldId);
    }, 450);
  };

  const cancelFieldPress = () => {
    clearTimeout(fieldPressTimerRef.current);
  };

  const startEditField = (field) => {
    setEditingFieldId(field.id);
    setEditingFieldTitle(field.title);
    setFieldActionMenuId(null);
  };

  const saveFieldTitle = (fieldId) => {
    const title = editingFieldTitle.trim();
    if (!title) return;
    updateField(fieldId, (field) => ({ ...field, title }));
    setEditingFieldId(null);
    setEditingFieldTitle("");
    setFieldActionMenuId(null);
  };

  const cancelEditField = () => {
    setEditingFieldId(null);
    setEditingFieldTitle("");
    setFieldActionMenuId(null);
  };

  const deleteField = (fieldId) => {
    if (fields.length === 1) return;
    const nextFields = fields.filter((field) => field.id !== fieldId);
    setFields(nextFields);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(nextFields[0].id);
    }
    setFieldActionMenuId(null);
    if (editingFieldId === fieldId) cancelEditField();
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
    const pos = clampMenuPosition(getPos(event));
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

  const renderFieldCanvas = () => (
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
              maxWidth: "92%",
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
                    flex: "0 0 auto",
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
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.row}>
            <button style={{ ...styles.button, ...styles.darkBtn }} onClick={() => setMobileView("sheet")}>
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
          <main style={styles.main}>
            <section style={styles.card}>
              <h2 style={styles.title}>필드 선택</h2>
              <p style={styles.sub}>짧게 누르면 열리고, 길게 누르면 수정/삭제 메뉴가 떠.</p>

              {fields.map((field) => {
                const selected = field.id === selectedFieldId;
                const editing = field.id === editingFieldId;
                const actionOpen = field.id === fieldActionMenuId;

                return (
                  <div
                    key={field.id}
                    style={{
                      ...styles.fieldItem,
                      background: selected ? "#0f172a" : "#ffffff",
                      color: selected ? "#ffffff" : "#0f172a",
                      borderColor: selected ? "#0f172a" : "#cbd5e1",
                    }}
                  >
                    {editing ? (
                      <>
                        <input
                          value={editingFieldTitle}
                          onChange={(e) => setEditingFieldTitle(e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #cbd5e1",
                            marginBottom: 8,
                          }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => saveFieldTitle(field.id)}
                            style={{ ...styles.button, ...styles.smallAction, background: "#22c55e", color: "#ffffff", flex: 1 }}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditField}
                            style={{ ...styles.button, ...styles.smallAction, background: "#e2e8f0", color: "#0f172a", flex: 1 }}
                          >
                            취소
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFieldId(field.id);
                            setMobileView("field");
                          }}
                          onPointerDown={() => startFieldPress(field.id)}
                          onPointerUp={cancelFieldPress}
                          onPointerLeave={cancelFieldPress}
                          onPointerCancel={cancelFieldPress}
                          style={{
                            display: "block",
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "inherit",
                            textAlign: "left",
                            padding: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 10,
                            cursor: "pointer",
                          }}
                        >
                          {field.title}
                        </button>

                        {actionOpen ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => startEditField(field)}
                              style={{
                                ...styles.button,
                                ...styles.smallAction,
                                background: selected ? "#334155" : "#e2e8f0",
                                color: selected ? "#ffffff" : "#0f172a",
                                flex: 1,
                              }}
                            >
                              이름 수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteField(field.id)}
                              disabled={fields.length === 1}
                              style={{
                                ...styles.button,
                                ...styles.smallAction,
                                background: fields.length === 1 ? "#cbd5e1" : "#ef4444",
                                color: "#ffffff",
                                flex: 1,
                                opacity: fields.length === 1 ? 0.6 : 1,
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: 12, color: selected ? "#cbd5e1" : "#64748b" }}>길게 눌러 수정 또는 삭제</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              <button
                style={{ ...styles.button, background: "#0f172a", color: "white", width: "100%", marginTop: 8 }}
                onClick={() => setShowAddInput((v) => !v)}
              >
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
          </main>
        ) : (
          <main style={styles.main} onTouchStart={handleSwipeStart} onTouchMove={handleSwipeMove} onTouchEnd={handleSwipeEnd}>
            {mobileView === "field" ? (
              <section style={styles.section}>
                <div style={{ ...styles.row, marginBottom: 10 }}>
                  <div>
                    <h2 style={{ ...styles.title, fontSize: 16 }}>필드</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>좌측으로 밀면 일기 화면</p>
                  </div>
                </div>
                {renderFieldCanvas()}
              </section>
            ) : (
              <section style={styles.card}>
                <div style={{ ...styles.row, marginBottom: 10 }}>
                  <div>
                    <h2 style={styles.title}>훈련 일기</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>우측으로 밀면 필드 화면</p>
                  </div>
                  <button style={{ ...styles.button, background: "#0f172a", color: "white", padding: "8px 12px", fontSize: 12 }} onClick={() => setMobileView("field")}>
                    필드 보기
                  </button>
                </div>
                <textarea
                  value={selectedEntry.journal}
                  onChange={(e) => updateSelectedEntry((entry) => ({ ...entry, journal: e.target.value }))}
                  placeholder="훈련 내용을 기록하세요"
                  style={styles.textarea}
                />
              </section>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
