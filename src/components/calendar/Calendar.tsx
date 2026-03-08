import { createSignal, createEffect, untrack, For, createMemo, Show } from 'solid-js';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { selectedDate, setSelectedDate, setIsSidebarCollapsed } from '../../state/ui';
import { recordDates } from '../../state/records';
import { preferences } from '../../state/preferences';
import { getTodayString } from '../../lib/dates';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasRecord: boolean;
  isFuture: boolean;
  isDisabled: boolean;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = createSignal(new Date());
  const [showPicker, setShowPicker] = createSignal(false);
  const [pickerYear, setPickerYear] = createSignal(new Date().getFullYear());

  const calendarDays = createMemo((): CalendarDay[] => {
    const month = currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const firstDayOfMonth = firstDay.getDay();
    const dates = recordDates();
    const today = getTodayString();
    const allowFuture = preferences().allowFutureRecords;
    const preferredFirstDay = preferences().firstDayOfWeek ?? 0;
    const daysFromPrevMonth = (firstDayOfMonth - preferredFirstDay + 7) % 7;

    const prevMonthDays: CalendarDay[] = [];
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = monthIndex - 1;
      const prevYear = prevMonth < 0 ? year - 1 : year;
      const actualMonth = prevMonth < 0 ? 11 : prevMonth;
      const dateStr = `${prevYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      prevMonthDays.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasRecord: dates.includes(dateStr),
        isFuture,
        isDisabled: !allowFuture && isFuture,
      });
    }

    const currentMonthDays: CalendarDay[] = [];
    const selected = selectedDate();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      currentMonthDays.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === selected,
        hasRecord: dates.includes(dateStr),
        isFuture,
        isDisabled: !allowFuture && isFuture,
      });
    }

    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays;
    const nextMonthDays: CalendarDay[] = [];
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = monthIndex + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const actualMonth = nextMonth > 11 ? 0 : nextMonth;
      const dateStr = `${nextYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      nextMonthDays.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasRecord: dates.includes(dateStr),
        isFuture,
        isDisabled: !allowFuture && isFuture,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  });

  createEffect(() => {
    const selected = new Date(selectedDate() + 'T00:00:00');
    const current = untrack(currentMonth);
    if (selected.getFullYear() !== current.getFullYear() || selected.getMonth() !== current.getMonth()) {
      setCurrentMonth(selected);
    }
  });

  const weekDays = createMemo(() => {
    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const preferredFirstDay = preferences().firstDayOfWeek ?? 0;
    return [...allDays.slice(preferredFirstDay), ...allDays.slice(0, preferredFirstDay)];
  });

  return (
    <div class="rounded-lg bg-primary p-4 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <Show
          when={showPicker()}
          fallback={
            <button onClick={() => setCurrentMonth(new Date(currentMonth().getFullYear(), currentMonth().getMonth() - 1))} class="rounded p-2 hover:bg-hover text-primary" aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
          }
        >
          <button onClick={() => setPickerYear((y) => y - 1)} class="rounded p-2 hover:bg-hover text-primary" aria-label="Previous year">
            <ChevronLeft size={20} />
          </button>
        </Show>

        <button
          onClick={() => {
            setPickerYear(currentMonth().getFullYear());
            setShowPicker((value) => !value);
          }}
          class="rounded px-2 py-1 text-sm font-semibold text-primary hover:bg-hover"
          aria-label={showPicker() ? 'Close month picker' : 'Open month picker'}
        >
          <Show when={showPicker()} fallback={currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
            {pickerYear()}
          </Show>
        </button>

        <Show
          when={showPicker()}
          fallback={
            <button onClick={() => setCurrentMonth(new Date(currentMonth().getFullYear(), currentMonth().getMonth() + 1))} class="rounded p-2 hover:bg-hover text-primary" aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          }
        >
          <button onClick={() => setPickerYear((y) => y + 1)} class="rounded p-2 hover:bg-hover text-primary" aria-label="Next year">
            <ChevronRight size={20} />
          </button>
        </Show>
      </div>

      <Show
        when={showPicker()}
        fallback={
          <>
            <div class="mb-2 grid grid-cols-7 gap-1">
              <For each={weekDays()}>{(day) => <div class="text-center text-xs font-medium text-tertiary">{day}</div>}</For>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <For each={calendarDays()}>
                {(day) => (
                  <button
                    onClick={() => {
                      if (day.isDisabled) return;
                      setSelectedDate(day.date);
                      setIsSidebarCollapsed(true);
                    }}
                    data-testid={`calendar-day-${day.date}`}
                    class={`relative flex h-8 w-8 flex-col items-center justify-center rounded text-sm ${
                      day.isCurrentMonth ? 'text-primary' : 'text-muted'
                    } ${day.isToday ? 'font-bold' : ''} ${
                      day.isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : !day.isDisabled ? 'hover:bg-hover' : ''
                    } ${day.isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                  >
                    <span>{day.day}</span>
                    <Show when={day.hasRecord}>
                      <span class={`absolute bottom-0.5 h-1 w-1 rounded-full ${day.isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                    </Show>
                  </button>
                )}
              </For>
            </div>
          </>
        }
      >
        <div class="grid grid-cols-3 gap-2">
          <For each={MONTH_NAMES}>
            {(monthName, index) => (
              <button
                onClick={() => {
                  setCurrentMonth(new Date(pickerYear(), index(), 1));
                  setShowPicker(false);
                }}
                class={`rounded px-2 py-2 text-sm ${
                  currentMonth().getFullYear() === pickerYear() && currentMonth().getMonth() === index()
                    ? 'bg-blue-600 text-white'
                    : 'text-primary hover:bg-hover'
                }`}
              >
                {monthName}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
