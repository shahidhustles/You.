"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  listEventsForDay,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/calendar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface DisplayEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}
interface PositionedEvent extends DisplayEvent {
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

function parseHM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function useActiveHour(refreshMs = 60_000) {
  const [activeHour, setActiveHour] = useState<number | null>(null);
  useEffect(() => {
    function tick() {
      const d = new Date();
      setActiveHour(d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600);
    }
    tick();
    const id = setInterval(tick, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return activeHour;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
// 4 columns * 6 hour blocks
const timeBlockColumns = [0, 6, 12, 18];

type TimeBlockProps = { date?: Date };

const TimeBlock = ({ date }: TimeBlockProps) => {
  const activeHour = useActiveHour();
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [dragState, setDragState] = useState<null | {
    colStart: number;
    startHour: number;
    endHour: number;
    creating: boolean;
  }>(null);
  const containerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isPending, startTransition] = useTransition();
  // Use provided date (immutable reference) or today
  const day = date ? new Date(date) : new Date();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // focus input when editing begins
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  function beginEdit(id: string, current: string) {
    setEditingId(id);
    setEditingValue(current);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue("");
  }

  function commitEdit() {
    if (!editingId) return;
    const newTitle = editingValue.trim();
    if (newTitle.length === 0) {
      cancelEdit();
      return;
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === editingId ? { ...e, title: newTitle } : e))
    );
    const idForUpdate = editingId;
    cancelEdit();
    updateEvent({ id: idForUpdate, title: newTitle }).catch((err) =>
      console.error(err)
    );
  }
  const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  // Load events whenever day changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listEventsForDay(day);
        if (!cancelled) {
          setEvents(
            list.map((e) => ({
              id: e.id,
              title: e.title,
              start: e.start,
              end: e.end,
            }))
          );
        }
      } catch (e) {
        console.error("Failed loading events", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // day object recreated from prop; dayKey ensures refetch on actual calendar day change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  //adds 30 min block (remove this later)
  async function quickAddSample() {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000);
    startTransition(async () => {
      try {
        const created = await createEvent({
          title: "New Focus Block",
          start: now,
          end,
        });
        if (created) {
          setEvents((prev) => [
            ...prev,
            {
              id: created.id,
              title: created.title,
              start: created.start,
              end: created.end,
            },
          ]);
        }
      } catch (e) {
        console.error("Failed creating event", e);
      }
    });
  }
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 mt-10 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Time Blocks</h2>
        <button
          onClick={quickAddSample}
          disabled={isPending}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          + 30m Block
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4 select-none">
        {timeBlockColumns.map((start) => {
          const end = start + 6;
          // Compute positioned events with lane assignment for this column
          const blockEvents: PositionedEvent[] = events
            .filter((e) => {
              const s = parseHM(e.start);
              return s >= start && s < end; // only those starting inside block
            })
            .map(
              (e) => ({ ...e }) as DisplayEvent
            ) as DisplayEvent[] as PositionedEvent[];
          // Sort by start then duration
          blockEvents.sort(
            (a, b) =>
              parseHM(a.start) - parseHM(b.start) ||
              parseHM(b.end) -
                parseHM(b.start) -
                (parseHM(a.end) - parseHM(a.start))
          );
          const lanes: { end: number }[] = [];
          blockEvents.forEach((ev) => {
            const s = parseHM(ev.start);
            let f = parseHM(ev.end);
            // Clamp end inside this 6h block so it doesn't overflow visually
            if (f > end) f = end;
            let laneIndex = lanes.findIndex((l) => l.end <= s + 0.0001);
            if (laneIndex === -1) {
              laneIndex = lanes.length;
              lanes.push({ end: f });
            } else {
              lanes[laneIndex].end = f;
            }
            (ev as PositionedEvent).lane = laneIndex;
            (ev as PositionedEvent).lanes = 0; // temp
            (ev as PositionedEvent).top = ((s - start) / 6) * 100;
            let height = ((f - s) / 6) * 100;
            if ((ev as PositionedEvent).top + height > 100) {
              height = 100 - (ev as PositionedEvent).top;
            }
            (ev as PositionedEvent).height = height;
          });
          const maxLane = Math.max(0, ...blockEvents.map((e) => e.lane));
          blockEvents.forEach((e) => (e.lanes = maxLane + 1));
          return (
            <div
              key={start}
              className="relative flex h-72 flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-xs"
              ref={(el) => {
                containerRefs.current[start] = el;
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                const target = e.target as HTMLElement;
                if (target.closest(".tb-event")) return; // clicked an event
                const rect = (
                  e.currentTarget as HTMLDivElement
                ).getBoundingClientRect();
                const y = e.clientY - rect.top - 16; // subtract header approx
                const pct = Math.min(1, Math.max(0, y / (rect.height - 16)));
                const hourInBlock = pct * 6; // 6 hour span
                const absHour = start + hourInBlock;
                const snapped = Math.floor(absHour * 2) / 2; // 30m increments
                setDragState({
                  colStart: start,
                  startHour: snapped,
                  endHour: snapped + 0.5,
                  creating: true,
                });
              }}
            >
              <div className="mb-1 text-center text-[10px] font-medium tracking-wide text-zinc-500">
                {start}:00 - {end}:00
              </div>
              <div className="relative flex-1">
                {/* Background hour grid */}
                {hours
                  .filter((h) => h >= start && h < end)
                  .map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-zinc-800"
                      style={{ top: `${((h - start) / 6) * 100}%` }}
                    />
                  ))}
                {/* Events */}
                {blockEvents.map((e) => {
                  const s = parseHM(e.start);
                  const f = parseHM(e.end);
                  const duration = f - s; // hours
                  const active =
                    activeHour != null && activeHour >= s && activeHour < f;
                  const widthPct = 100 / e.lanes;
                  const leftPct = e.lane * widthPct;
                  return (
                    <ContextMenu key={e.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          data-role="event"
                          className={cn(
                            "tb-event group absolute rounded-md border px-2 py-1 text-[10px] font-medium shadow-sm cursor-pointer",
                            active
                              ? "bg-zinc-100 text-zinc-900 border-zinc-300"
                              : "bg-zinc-800/70 text-zinc-200 border-zinc-700 hover:border-zinc-500",
                            selectedId === e.id &&
                              !active &&
                              "ring-1 ring-zinc-300/70 border-zinc-400"
                          )}
                          style={{
                            top: `${e.top}%`,
                            height: `${e.height}%`,
                            width: `calc(${widthPct}% - 4px)`,
                            left: `calc(${leftPct}% + 2px)`,
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedId(e.id === selectedId ? null : e.id);
                          }}
                          onDoubleClick={() => {
                            beginEdit(e.id, e.title);
                          }}
                        >
                          {editingId === e.id ? (
                            <input
                              ref={editInputRef}
                              value={editingValue}
                              onChange={(ev) =>
                                setEditingValue(ev.target.value)
                              }
                              onBlur={commitEdit}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter") {
                                  ev.preventDefault();
                                  commitEdit();
                                } else if (ev.key === "Escape") {
                                  ev.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              className="w-full rounded bg-transparent px-0 text-[10px] font-medium focus:outline-none focus:ring-0"
                            />
                          ) : duration <= 1 ? (
                            <div className="leading-tight">
                              {e.start} – {e.end} · {e.title}
                            </div>
                          ) : (
                            <div className="line-clamp-3 leading-tight">
                              {e.title}
                            </div>
                          )}
                          {duration > 0.5 && (
                            <div className="mt-0.5 text-[9px] font-normal opacity-70">
                              {e.start} – {e.end}
                            </div>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-40">
                        <ContextMenuItem
                          onClick={() => beginEdit(e.id, e.title)}
                        >
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem
                          variant="destructive"
                          onClick={() => {
                            const id = e.id;
                            setEvents((prev) =>
                              prev.filter((ev) => ev.id !== id)
                            );
                            deleteEvent(id).catch((err) => console.error(err));
                          }}
                        >
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
                {dragState && dragState.colStart === start && (
                  <div
                    className="absolute left-1 right-1 rounded-md border border-dashed border-zinc-500/60 bg-zinc-700/20"
                    style={{
                      top: `${((dragState.startHour - start) / 6) * 100}%`,
                      height: `${((dragState.endHour - dragState.startHour) / 6) * 100}%`,
                    }}
                  />
                )}
                {/* Active indicator line if inside this block */}
                {activeHour != null &&
                  activeHour >= start &&
                  activeHour < end && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 h-0.5 -translate-y-1/2 bg-zinc-100"
                      style={{ top: `${((activeHour - start) / 6) * 100}%` }}
                    />
                  )}
              </div>
            </div>
          );
        })}
      </div>
      {dragState && (
        <div
          className="fixed inset-0 z-50 cursor-row-resize"
          onMouseMove={(e) => {
            const col = dragState.colStart;
            const el = containerRefs.current[col];
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const y = e.clientY - rect.top - 16;
            const pct = Math.min(1, Math.max(0, y / (rect.height - 16)));
            const hourInBlock = pct * 6;
            const absHour = col + hourInBlock;
            const snapped = Math.floor(absHour * 4) / 4; // 15m steps while dragging
            setDragState((ds) =>
              ds
                ? { ...ds, endHour: Math.max(snapped, ds.startHour + 0.25) }
                : ds
            );
          }}
          onMouseUp={async () => {
            if (!dragState) return;
            const { startHour, endHour } = dragState;
            const dayDate = new Date(day);
            const startDate = new Date(dayDate);
            startDate.setHours(
              Math.floor(startHour),
              (startHour % 1) * 60,
              0,
              0
            );
            const endDate = new Date(dayDate);
            endDate.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
            // Create event optimistically
            const tempId = `temp-${Date.now()}`;
            const display = {
              id: tempId,
              title: "New Block",
              start: `${String(Math.floor(startHour)).padStart(2, "0")}:${String((startHour % 1) * 60).padStart(2, "0")}`,
              end: `${String(Math.floor(endHour)).padStart(2, "0")}:${String((endHour % 1) * 60).padStart(2, "0")}`,
            };
            setEvents((prev) => [...prev, display]);
            setDragState(null);
            try {
              const created = await createEvent({
                title: display.title,
                start: startDate,
                end: endDate,
              });
              if (created) {
                setEvents((prev) =>
                  prev.map((e) =>
                    e.id === tempId
                      ? {
                          id: created.id,
                          title: created.title,
                          start: created.start,
                          end: created.end,
                        }
                      : e
                  )
                );
              }
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </section>
  );
};
export default TimeBlock;
