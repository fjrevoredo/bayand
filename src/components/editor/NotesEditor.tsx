import { createEffect, onCleanup, onMount, createSignal } from 'solid-js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import RecordToolbar from './RecordToolbar';

interface NotesEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: Editor) => void;
  spellCheck?: boolean;
}

export default function NotesEditor(props: NotesEditorProps) {
  let editorElement!: HTMLDivElement;
  const [editor, setEditor] = createSignal<Editor | null>(null);

  onMount(() => {
    if (!editorElement) return;

    const editorInstance = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder: props.placeholder || 'Add notes...',
        }),
        Underline,
        Highlight,
      ],
      content: props.content,
      editorProps: {
        attributes: {
          class:
            'record-editor-content prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none',
          spellcheck: String(props.spellCheck ?? true),
        },
      },
      onUpdate: ({ editor }) => {
        props.onUpdate?.(editor.getHTML());
      },
    });

    setEditor(editorInstance);
    props.onEditorReady?.(editorInstance);
  });

  createEffect(() => {
    const editorInstance = editor();
    if (editorInstance && props.content !== editorInstance.getHTML()) {
      editorInstance.commands.setContent(props.content);
    }
  });

  createEffect(() => {
    const editorInstance = editor();
    if (editorInstance) {
      editorInstance.view.dom.setAttribute('spellcheck', String(props.spellCheck ?? true));
    }
  });

  onCleanup(() => {
    editor()?.destroy();
  });

  return (
    <div class="overflow-hidden rounded-lg border border-primary bg-primary">
      <RecordToolbar editor={editor()} />
      <div class="p-4">
        <div ref={editorElement} />
      </div>
    </div>
  );
}
