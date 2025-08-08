"use server";
import { getGoogleToken } from "./access-token";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date; // full Date object
  end: Date; // full Date object
}

interface NormalizedEvent {
  id: string;
  title: string;
  start: string; // HH:MM 24h local
  end: string; // HH:MM 24h local
  startDate: Date;
  endDate: Date;
}

function fmtHM(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Fetch Google Calendar events for a single day (local timezone), spanning the entire 24h window. */
export async function listEventsForDay(day: Date): Promise<NormalizedEvent[]> {
  const { token } = await getGoogleToken();
  if (!token) return [];

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      // Revalidate often (tweak as needed)
      cache: "no-store",
    }
  );
  if (!res.ok) {
    console.error("Failed to fetch events", await res.text());
    return [];
  }
  const data = await res.json();
  interface GCalItem {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  }
  const events: NormalizedEvent[] = (data.items || [])
    .map((item: GCalItem) => {
      // Determine start/end Date objects (handle all-day)
      const startStr = item.start?.dateTime || item.start?.date;
      const endStr = item.end?.dateTime || item.end?.date;
      if (!startStr || !endStr) return null;
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      // Filter events that do not overlap the day window
      if (endDate <= dayStart || startDate >= dayEnd) return null;
      // Clamp to day boundaries for display
      const displayStart = new Date(
        Math.max(startDate.getTime(), dayStart.getTime())
      );
      const displayEnd = new Date(
        Math.min(endDate.getTime(), dayEnd.getTime())
      );
      return {
        id: item.id as string,
        title: (item.summary as string) || "(No title)",
        start: fmtHM(displayStart),
        end: fmtHM(displayEnd),
        startDate: startDate,
        endDate: endDate,
      };
    })
    .filter(Boolean);
  return events;
}

interface CreateEventInput {
  title: string;
  start: Date; // must be within the desired day
  end: Date; // > start
  description?: string;
}

export async function createEvent(
  input: CreateEventInput
): Promise<NormalizedEvent | null> {
  const { token } = await getGoogleToken();
  if (!token) return null;

  const body = {
    summary: input.title,
    description: input.description || undefined,
    start: { dateTime: input.start.toISOString() },
    end: { dateTime: input.end.toISOString() },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    console.error("Failed to create event", await res.text());
    return null;
  }
  const item = await res.json();
  const startDate = new Date(item.start?.dateTime || item.start?.date);
  const endDate = new Date(item.end?.dateTime || item.end?.date);
  return {
    id: item.id,
    title: item.summary || "(No title)",
    start: fmtHM(startDate),
    end: fmtHM(endDate),
    startDate,
    endDate,
  };
}

interface UpdateEventInput {
  id: string;
  title?: string;
  start?: Date;
  end?: Date;
  description?: string;
}

export async function updateEvent(
  input: UpdateEventInput
): Promise<NormalizedEvent | null> {
  const { token } = await getGoogleToken();
  if (!token) return null;
  const patch: Record<string, unknown> = {};
  if (input.title) patch.summary = input.title;
  if (input.description) patch.description = input.description;
  if (input.start) patch.start = { dateTime: input.start.toISOString() };
  if (input.end) patch.end = { dateTime: input.end.toISOString() };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${input.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    console.error("Failed to update event", await res.text());
    return null;
  }
  const item = await res.json();
  const startDate = new Date(item.start?.dateTime || item.start?.date);
  const endDate = new Date(item.end?.dateTime || item.end?.date);
  return {
    id: item.id,
    title: item.summary || "(No title)",
    start: fmtHM(startDate),
    end: fmtHM(endDate),
    startDate,
    endDate,
  };
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { token } = await getGoogleToken();
  if (!token) return false;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    console.error("Failed to delete event", res.status, await res.text());
    return false;
  }
  return true;
}

//for AI to create event (tool use)
// Convenience: provide startTime,endTime, title using today's date (local)
export async function createQuickEvent(opts: {
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
}): Promise<NormalizedEvent | null> {
  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [sh, sm] = opts.startTime.split(":").map(Number);
  const [eh, em] = opts.endTime.split(":").map(Number);
  const start = new Date(day);
  start.setHours(sh, sm ?? 0, 0, 0);
  const end = new Date(day);
  end.setHours(eh, em ?? 0, 0, 0);
  if (end <= start) {
    end.setTime(start.getTime() + 30 * 60 * 1000); // ensure at least 30m
  }
  return createEvent({
    title: opts.title,
    description: opts.description,
    start,
    end,
  });
}
