export function normalizeEventsToToday(events: {
  start: string,
  end: string,
}[]) {
  // Get today's date at midnight (start of day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  // Get today's date at end of day (23:59:59.999)
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  return events.map(event => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    // If event starts before today, set start to today's beginning
    if (startDate < todayStart) {
      startDate.setTime(todayStart.getTime());
    }
    
    // If event ends after today, set end to today's end
    if (endDate > todayEnd) {
      endDate.setTime(todayEnd.getTime());
    }
    
    // Only return events that have some overlap with today
    if (startDate <= todayEnd && endDate >= todayStart) {
      return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    }
    
    return null;
  }).filter(event => event !== null);
}