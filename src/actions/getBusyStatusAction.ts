import { defineAction } from "astro:actions";
import { z } from "astro:schema";

const DEFAULT_DAYS_AHEAD = 5;
const DEFAULT_CALENDAR_ID = "saphalpdyl@gmail.com";

export default defineAction({
  input: z.object({
    daysAhead: z.number().min(1, 'cannot be less than 1').default(DEFAULT_DAYS_AHEAD),
  }),
  handler: async({ daysAhead }) : Promise<FreeBusyStatus>=> {
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 1)
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + daysAhead);

    const rawResponse = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${import.meta.env.GOOGLE_CALENDAR_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        
        items: [
          {
            id: DEFAULT_CALENDAR_ID,
          }
        ]
      })
    });

    console.log(JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [
        {
          id: DEFAULT_CALENDAR_ID,
        }
      ]
    }));
    console.log("ERROR RESPONSE: ", rawResponse);
    const response = await rawResponse.json();

    const busySchedule: {
      start: string,
      end: string,
    }[] = response.calendars[DEFAULT_CALENDAR_ID].busy;
    
    const now = new Date();

    // Check if currently busy
    const currentBusySlot = busySchedule.find(slot => 
        now >= new Date(slot.start) && now <= new Date(slot.end)
    );

    if (currentBusySlot) {
        // Currently busy
        return {
            status: 'busy',
            freeAt: new Date(currentBusySlot.end),
        };
    } else {
        // Currently free
        const nextBusySlot = busySchedule.find(slot => new Date(slot.start) > now);
        return {
            status: 'free',
            busyAt: nextBusySlot ? new Date(nextBusySlot.start) : null
        };
    }
  }
})