export const WEEK_DAYS = [
  { label: "Понеділок", value: 1 },
  { label: "Вівторок", value: 2 },
  { label: "Середа", value: 3 },
  { label: "Четвер", value: 4 },
  { label: "П'ятниця", value: 5 },
  { label: "Субота", value: 6 },
  { label: "Неділя", value: 0 },
];

export const SHORT_DAY_NAMES = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// Найближча дата з потрібним днем тижня і часом.
// Якщо день тижня збігається з сьогоднішнім - береться наступний тиждень.
export const getNextOccurrence = (dayOfWeek: number, time: Date): Date => {
  const now = new Date();
  const result = new Date(now);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);

  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  result.setDate(now.getDate() + daysUntil);

  return result;
};

// Поточна дата з округленням до години - дефолтне значення для пікерів
export const getCurrentHour = (): Date => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  return date;
};
