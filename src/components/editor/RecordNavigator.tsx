import { Show } from 'solid-js';

interface RecordNavigatorProps {
  total: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  addDisabled?: boolean;
  addTitle?: string;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteTitle?: string;
}

export default function RecordNavigator(props: RecordNavigatorProps) {
  return (
    <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-1 text-sm dark:border-neutral-700">
      <Show when={props.total >= 2}>
        <div class="flex items-center gap-2">
          <button
            onClick={() => props.onPrev()}
            disabled={props.index === 0}
            class="rounded px-2 py-0.5 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label="Previous record"
          >
            ←
          </button>
          <span class="text-neutral-500">
            {props.index + 1} / {props.total}
          </span>
          <button
            onClick={() => props.onNext()}
            disabled={props.index === props.total - 1}
            class="rounded px-2 py-0.5 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label="Next record"
          >
            →
          </button>
        </div>
      </Show>

      <div class="flex items-center gap-2">
        <Show when={props.total > 1 && props.onDelete}>
          <button
            onClick={() => props.onDelete?.()}
            disabled={props.deleteDisabled}
            title={props.deleteTitle}
            class="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
            aria-label={props.deleteTitle ?? 'Delete record'}
          >
            −
          </button>
        </Show>
        <button
          onClick={() => props.onAdd()}
          disabled={props.addDisabled}
          title={props.addTitle}
          class="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
          aria-label={props.addTitle ?? 'Add record'}
        >
          +
        </button>
      </div>
    </div>
  );
}
