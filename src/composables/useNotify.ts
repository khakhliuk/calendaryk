import { useToast } from "primevue/usetoast";
import { getErrorMessage } from "../utils/strings";

export const useNotify = () => {
  const toast = useToast();

  const success = (summary: string) => {
    toast.add({ severity: "success", summary, life: 2000 });
  };

  const warn = (summary: string) => {
    toast.add({ severity: "warn", summary, life: 3000 });
  };

  const error = (summary: string, err?: unknown) => {
    if (err) console.error(err);

    toast.add({
      severity: "error",
      summary,
      detail: err ? getErrorMessage(err) : undefined,
      life: 3000,
    });
  };

  return { success, warn, error };
};
