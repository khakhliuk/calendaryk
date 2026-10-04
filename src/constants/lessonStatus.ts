export type LessonStatus = "scheduled" | "happened" | "canceled";

export const LESSON_STATUS_OPTIONS: { label: string; value: LessonStatus }[] = [
  { label: "Заплановано", value: "scheduled" },
  { label: "Відбулось", value: "happened" },
  { label: "Скасовано", value: "canceled" },
];

export const getStatusLabel = (status: string) =>
  LESSON_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
