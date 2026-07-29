import { useImperativeHandle, forwardRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

const Underline = Mark.create({
  name: "underline",
  parseHTML() {
    return [{ tag: "u" }, { style: "text-decoration=underline" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    return { "Mod-u": () => this.editor.commands.toggleMark(this.name) };
  },
});

export interface RichTextEditorRef {
  getHTML: () => string;
}

interface Props {
  initialValue: string;
  placeholder?: string;
}

/* ── Toolbar state ──────────────────────────────────────────────── */

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  h2: boolean;
  h3: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
}

const EMPTY: ToolbarState = {
  bold: false, italic: false, underline: false,
  h2: false, h3: false, bulletList: false, orderedList: false,
  blockquote: false, link: false,
};

/* ── Toolbar button ──────────────────────────────────────────────── */

function Btn({ onAction, children, title, active }: {
  onAction: () => void;
  children: React.ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAction}
      className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
        active ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-hover hover:text-body"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px bg-border-input mx-1" />;
}

/* ── Editor ──────────────────────────────────────────────────────── */

export default forwardRef<RichTextEditorRef, Props>(function RichTextEditor(
  { initialValue, placeholder },
  ref,
) {
  const [active, setActive] = useState<ToolbarState>(EMPTY);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || "Write your article..." }),
    ],
    content: initialValue || "",
    editorProps: {
      attributes: { class: "kb-content p-3 min-h-[200px] text-sm text-body outline-none" },
    },
    onTransaction({ editor: e }) {
      setActive({
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        link: e.isActive("link"),
      });
    },
  });

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() || "",
  }));

  const insertLink = useCallback(() => {
    if (!editor) return;
    if (editor.state.selection.from === editor.state.selection.to) {
      alert("Select text first");
      return;
    }
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border-input rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border-input bg-surface select-none">
        <Btn title="Bold (Ctrl+B)" active={active.bold} onAction={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={active.italic} onAction={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={active.underline} onAction={() => editor.chain().focus().toggleMark("underline").run()}>
          <u>U</u>
        </Btn>
        <Sep />
        <Btn title="Heading 2" active={active.h2} onAction={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn title="Heading 3" active={active.h3} onAction={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Btn title="Paragraph" onAction={() => editor.chain().focus().setParagraph().run()}>
          P
        </Btn>
        <Sep />
        <Btn title="Bullet List" active={active.bulletList} onAction={() => editor.chain().focus().toggleBulletList().run()}>
          &bull; List
        </Btn>
        <Btn title="Numbered List" active={active.orderedList} onAction={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </Btn>
        <Sep />
        <Btn title="Quote" active={active.blockquote} onAction={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo; Quote
        </Btn>
        <Btn title="Insert Link" active={active.link} onAction={insertLink}>
          Link
        </Btn>
        <Btn title="Insert Image" onAction={insertImage}>
          Img
        </Btn>
        <Sep />
        <Btn title="Undo (Ctrl+Z)" onAction={() => editor.chain().focus().undo().run()}>
          &#8617;
        </Btn>
        <Btn title="Redo (Ctrl+Y)" onAction={() => editor.chain().focus().redo().run()}>
          &#8618;
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
