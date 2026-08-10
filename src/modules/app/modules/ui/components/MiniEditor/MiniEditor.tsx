import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import clsx from "clsx";

export interface MiniEditorRef {
  getHTML: () => string;
  isEmpty: () => boolean;
}

interface Props {
  initialValue?: string;
  placeholder?: string;
  minHeight?: number;
}

export default forwardRef<MiniEditorRef, Props>(function MiniEditor(
  { initialValue = "", placeholder = "", minHeight = 120 },
  ref,
) {
  const [active, setActive] = useState({ bold: false, italic: false, strike: false, code: false, codeBlock: false, bulletList: false, orderedList: false });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    content: initialValue || "",
    editorProps: {
      attributes: {
        class: "comment-editor px-3 py-2 text-sm text-body outline-none overflow-auto",
        style: `min-height: ${minHeight}px; max-height: 300px;`,
      },
    },
  });

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() || "",
    isEmpty: () => editor?.isEmpty ?? true,
  }));

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      setActive({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        strike: editor.isActive("strike"),
        code: editor.isActive("code"),
        codeBlock: editor.isActive("codeBlock"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  const TBtn = ({ onAction, children, title, isActive }: {
    onAction: () => void; children: React.ReactNode; title: string; isActive?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAction}
      className={clsx(
        "px-1.5 py-0.5 text-xs rounded transition-colors cursor-pointer",
        isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-hover hover:text-body",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-border-input rounded-lg overflow-hidden bg-surface">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border-input bg-surface select-none">
        <TBtn title="Bold (Ctrl+B)" isActive={active.bold} onAction={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </TBtn>
        <TBtn title="Italic (Ctrl+I)" isActive={active.italic} onAction={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </TBtn>
        <TBtn title="Strikethrough" isActive={active.strike} onAction={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </TBtn>
        <span className="w-px h-4 bg-border-input mx-0.5" />
        <TBtn title="Inline Code" isActive={active.code} onAction={() => editor.chain().focus().toggleCode().run()}>
          {'</>'}
        </TBtn>
        <TBtn title="Code Block" isActive={active.codeBlock} onAction={() => editor.chain().focus().toggleCodeBlock().run()}>
          {'{ }'}
        </TBtn>
        <span className="w-px h-4 bg-border-input mx-0.5" />
        <TBtn title="Bullet List" isActive={active.bulletList} onAction={() => editor.chain().focus().toggleBulletList().run()}>
          &bull; List
        </TBtn>
        <TBtn title="Numbered List" isActive={active.orderedList} onAction={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </TBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
