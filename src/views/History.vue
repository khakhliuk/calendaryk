<template>
  <div>
    <!-- Schedule List -->
    <div class="px-4 py-2">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Історія занять</h2>
      <div class="space-y-1">
        <!-- <Select
          v-model="filterStudent"
          :options="allStudents"
          optionLabel="name"
          filter
          placeholder="Оберіть учня для фільтрації"
          class="w-full multiselect-multiline"
        /> -->
        <div class="flex space-x-2">
          <div class="flex-auto mb-1">
            <label for="buttondisplay" class="mb-2 text-gray-700">
              Дата з
            </label>
            <DatePicker
              v-model="startDate"
              showIcon
              fluid
              size="small"
              iconDisplay="input"
              dateFormat="dd/mm/yy"
            />
          </div>

          <div class="flex-auto">
            <label for="buttondisplay" class="mb-2 text-gray-700">
              Дата по
            </label>
            <DatePicker
              size="small"
              v-model="endDate"
              showIcon
              fluid
              iconDisplay="input"
              dateFormat="dd/mm/yy"
            />
          </div>
        </div>
        <div
          v-if="attendances.length !== 0"
          v-for="item in attendances"
          class="rounded-lg p-2 text-gray-700 border-l-4 shadow-sm"
          :class="
            item.students.every((s) => s.status === 'happened')
              ? item.students.length > 1
                ? 'border-green-400 '
                : 'border-blue-400'
              : item.students.some((s) => s.status === 'happened')
                ? 'border-yellow-400'
                : 'border-red-400 bg-red-50'
          "
        >
          <div class="flex flex-row justify-between">
            <div class="flex flex-row">
              <div class="flex flex-col text-sm text-gray-800">
                <div class="flex items-center">
                  <i class="pi pi-clock mr-1" style="font-size: 1rem"></i>

                  <span>{{ format(item.date, " HH:mm, dd.MM.yyyy") }}</span>
                  <span
                    v-if="
                      item.students.length === 1 &&
                      item.students[0].status === 'canceled'
                    "
                    class="font-semibold text-red-500 ml-2"
                  >
                    Скасовано
                  </span>
                </div>

                <div v-if="item.students.length === 1">
                  <span class="truncate">{{ item.students[0].name }}</span>
                </div>
                <span v-if="item.schedule">{{
                  item.schedule.groups?.title
                }}</span>
              </div>
            </div>

            <div class="flex justify-between items-center">
              <Button
                v-if="item.students.length > 1"
                icon="pi pi-chevron-down"
                severity="secondary"
                variant="text"
                rounded
                size="small"
                iconPos="right"
                label="Відвідування"
                @click="item.showStudents = !item.showStudents"
              />

              <Button
                v-else
                :icon="
                  item.students[0].status !== 'happened'
                    ? 'pi pi-circle'
                    : 'pi pi-check-circle'
                "
                :severity="
                  item.students[0].status !== 'happened'
                    ? 'danger'
                    : 'secondary'
                "
                variant="text"
                rounded
                aria-label="Cancel"
                @click="updateStatus(item.students[0])"
              />

              <!-- <Button
                v-else
                type="button"
                size="small"
                icon="pi pi-ellipsis-v"
                @click="
                  (e) => {
                    menuStudent = item.students[0];
                    contextMenu.toggle(e);
                  }
                "
                aria-haspopup="true"
                aria-controls="overlay_menu"
                variant="text"
                severity="contrast"
              /> -->
            </div>
          </div>
          <div
            class="flex flex-col space-y-1 mt-1"
            v-if="item.students.length > 1 && item.showStudents"
          >
            <div
              v-for="student in item.students"
              class="text-gray-700 text-sm flex flex-row justify-between"
            >
              <div>
                <i class="pi pi-user mr-1" style="color: #708090"></i>
                <span class="truncate">{{ student.name }}</span>
              </div>
              <Checkbox
                class="mr-2"
                :invalid="student.status !== 'happened'"
                :model-value="student.status === 'happened'"
                @update:model-value="updateStatus(student)"
                binary
              />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10">
          <p class="text-gray-500">Історія за цей період відсутня.</p>
        </div>
      </div>
    </div>

    <Menu ref="contextMenu" id="overlay_menu" :model="items" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref, watch, computed } from "vue";
import { supabase } from "../lib/supabaseClient.js";
import { format } from "date-fns";
import type { User } from "../models/user.js";
import type {
  GetHistoryAttendance,
  GroupedAttendance,
} from "../models/getHistoryAttendance.js";

const attendances: Ref<GroupedAttendance[]> = ref([]);
const filterStudent: Ref<User | null> = ref(null);
const allStudents: Ref<User[]> = ref([]);

const now = new Date();
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1));
const endDate = ref(new Date());

//const contextMenu = ref();
const menuStudent = ref<any>(null);

const items = computed(() => [
  {
    label: "Опції",
    items: [
      {
        label:
          menuStudent.value?.status === "happened"
            ? "Відмітити як скасоване"
            : "Відбулося",
        icon: "pi pi-times",
        command: () => {
          updateStatus(menuStudent.value);
        },
      },
    ],
  },
]);

const updateStatus = async (student: any) => {
  const newStatus = student.status === "happened" ? "canceled" : "happened";
  const { error } = await supabase
    .from("attendances")
    .update({ status: newStatus })
    .eq("id", student.attendance_id);

  if (error) {
    console.error("Error updating status:", error);
  } else {
    student.status = newStatus;
  }
};

onMounted(async () => {
  await getData();
  await getStudents();
});

const getStudents = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: relations, error: relError } = await supabase
    .from("teachers_students")
    .select("id, student_id")
    .eq("teacher_id", user!.id);

  if (relError) {
    console.error(relError);
    return;
  }

  if (!relations || relations.length === 0) {
    allStudents.value = [];
    console.log("there no relations!");
    return;
  }

  const studentIds = relations.map((r) => r.student_id);

  const { data: studentsData, error: studError } = await supabase
    .from("users")
    .select("*")
    .in("user_id", studentIds)
    .order("name");

  if (studError) {
    console.error(studError);
    return;
  }

  if (studentsData) {
    allStudents.value = studentsData;
  }
};

const getData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    endDate.value.setHours(23);
    endDate.value.setMinutes(59);
    endDate.value.setSeconds(59);

    const { data, error } = await supabase
      .from("attendances")
      .select(
        `
    id,
    date,
    status,
    student_id,
    note,
    schedule_id,
    users!attendances_student_id_fkey (
      user_id,
      name
    ),
    schedule: schedule_id (
      id,
      start_date,
      title,
      group_id,
      groups (
        id,
        title
      )
    )
  `,
      )
      .gte("date", startDate.value.toISOString())
      .lt("date", endDate.value.toISOString())
      .eq("teacher_id", user!.id)
      .neq("status", "scheduled")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }
    if (!data) return;

    const normalizedData: GetHistoryAttendance[] = data.map((d: any) => ({
      id: d.id,
      date: new Date(d.date),
      status: d.status,
      student_id: d.student_id,
      note: d.note,
      schedule_id: d.schedule_id,
      users: Array.isArray(d.users) ? d.users[0] : d.users,
      schedule: Array.isArray(d.schedule) ? d.schedule[0] : d.schedule,
    }));

    attendances.value = groupAttendance(normalizedData);
    console.log(data);
  } catch (error) {
    console.error("Error loading schedule:", error);
  }
};

function groupAttendance(records: GetHistoryAttendance[]): GroupedAttendance[] {
  const map = new Map<string, GroupedAttendance>();

  records.forEach((record) => {
    if (!record.schedule) {
      const key = `no_schedule_${record.id}`;
      map.set(key, {
        schedule_id: null,
        schedule: null,
        date: record.date,
        students: [
          {
            attendance_id: record.id,
            student_id: record.student_id,
            name: record.users.name,
            status: record.status,
            note: record.note,
          },
        ],
        showStudents: false,
      });
      return;
    }

    const dateKey = format(record.date, "yyyy-MM-dd");

    const key = record.schedule.group_id
      ? `${record.schedule.id}_${record.schedule.group_id}_${dateKey}`
      : `${record.schedule.id}_${record.student_id}_${dateKey}`;

    if (!map.has(key)) {
      map.set(key, {
        schedule_id: record.schedule.id,
        schedule: record.schedule,
        date: record.date,
        students: [],
        showStudents: false,
      });
    }

    const group = map.get(key)!;
    group.students.push({
      attendance_id: record.id,
      student_id: record.student_id,
      name: record.users.name,
      status: record.status,
      note: record.note,
    });
  });

  return Array.from(map.values());
}

watch([filterStudent, startDate, endDate], async () => {
  await getData();
});
</script>

<style scoped></style>
