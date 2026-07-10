import { eachWeekendOfInterval, endOfMonth, isSaturday, isSunday } from 'date-fns';

const startDate = new Date(2024, 0, 1);
const endDate = endOfMonth(new Date(2026, 7, 1));
const allWeekends = eachWeekendOfInterval({ start: startDate, end: endDate });

const ANNOUNCERS = ['Roque de Freitas', 'Aroldo Dias', 'Daniel Miller'];
const weekends = [];
let announcerIndex = 0;

for (let i = 0; i < allWeekends.length; i++) {
  const date = allWeekends[i];
  if (isSaturday(date)) {
    const saturday = date;
    let sunday = date;
    if (i + 1 < allWeekends.length && isSunday(allWeekends[i+1])) {
      sunday = allWeekends[i+1];
      i++;
    }
    weekends.push({ saturday, sunday, announcer: ANNOUNCERS[announcerIndex] });
    announcerIndex = (announcerIndex + 1) % ANNOUNCERS.length;
  }
}

const target = weekends.find(w => w.saturday.getDate() === 11 && w.saturday.getMonth() === 6 && w.saturday.getFullYear() === 2026);
console.log('July 11 2026 with 2024 is:', target ? target.announcer : 'Not found');
