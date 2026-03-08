import { createEffect } from 'solid-js';

interface RecordTitleProps {
  value: string;
  onInput?: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  spellCheck?: boolean;
}

export default function RecordTitle(props: RecordTitleProps) {
  let inputRef!: HTMLInputElement;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      props.onEnter?.();
    }
  };

  createEffect(() => {
    inputRef?.focus();
  });

  return (
    <input
      ref={inputRef}
      type="text"
      data-testid="title-input"
      value={props.value}
      onInput={(event) => props.onInput?.(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      placeholder={props.placeholder || 'Record title'}
      spellcheck={props.spellCheck ?? true}
      class="w-full border-0 bg-transparent px-0 text-2xl font-semibold text-primary placeholder-tertiary focus:outline-none focus:ring-0"
    />
  );
}
