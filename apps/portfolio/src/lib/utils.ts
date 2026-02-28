export function isDateToday(date: Date): boolean {
  // Takes in a date and returns whether the date is today relative to the system date

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to the beginning of today

  const pDate = new Date(date.getTime());
  pDate.setHours(0, 0, 0, 0); // Reset time to compare only the date part

  return pDate.getTime() === today.getTime(); // Compare date without time
}