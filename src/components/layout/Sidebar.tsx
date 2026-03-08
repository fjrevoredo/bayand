import { Show } from 'solid-js';
import { X, Calendar as CalendarIcon } from 'lucide-solid';
import Calendar from '../calendar/Calendar';
import { selectedDate, setSelectedDate } from '../../state/ui';
import { getTodayString } from '../../lib/dates';

interface SidebarProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <>
      <Show when={!props.isCollapsed}>
        <div
          class="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => props.onClose?.()}
        />
      </Show>

      <aside
        class={`fixed inset-y-0 left-0 z-30 w-80 transform border-r border-primary bg-primary transition-transform duration-300 lg:relative lg:translate-x-0 ${
          props.isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div class="flex h-full flex-col">
          <div class="flex h-16 items-center justify-between border-b border-primary px-4">
            <div>
              <h2 class="text-xl font-bold text-primary">Bayand</h2>
              <p class="text-xs uppercase tracking-[0.2em] text-tertiary">Local-only tracker</p>
            </div>
            <Show when={!props.isCollapsed}>
              <button
                onClick={() => props.onClose?.()}
                class="rounded p-2 text-primary hover:bg-hover lg:hidden"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </Show>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div class="space-y-4">
              <div class="flex justify-start">
                <button
                  onClick={() => setSelectedDate(getTodayString())}
                  disabled={selectedDate() === getTodayString()}
                  class="flex items-center gap-2 rounded-md bg-tertiary px-3 py-2 text-sm font-medium text-secondary hover:bg-active disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Go to today"
                  title="Go to today"
                >
                  <CalendarIcon size={16} />
                  Today
                </button>
              </div>
              <Calendar />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
