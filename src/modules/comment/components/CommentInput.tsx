import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import clsx from "clsx";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import { CannedResponse } from "@modules/canned-response/services/canned-response.service";

// ── Props ─────────────────────────────────────────────────────

interface Props {
  members: WorkspaceMember[];
  loading: boolean;
  onSubmit: (content: string) => void;
  onSubmitAndResolve?: (content: string) => void;
  canResolve?: boolean;
  cannedResponses?: CannedResponse[];
}

// ── Component ─────────────────────────────────────────────────

export default function CommentInput({ members, loading, onSubmit, onSubmitAndResolve, canResolve = false, cannedResponses = [] }: Props) {
  const { t } = useTranslation();
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [cannedSearch, setCannedSearch] = useState("");
  const [cannedIndex, setCannedIndex] = useState(0);
  const [cannedPos, setCannedPos] = useState<{ top: number; left: number } | null>(null);
  const sendMenuRef = useRef<HTMLDivElement>(null);

  // Mention popup state (managed manually, not via tippy)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number } | null>(null);
  const mentionCommandRef = useRef<((attrs: { id: string; label: string }) => void) | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const filteredMembers = useMemo(
    () =>
      mentionQuery !== null
        ? members
            .filter((m) => {
              const name = `${m.firstName} ${m.lastName}`.toLowerCase();
              return name.includes(mentionQuery.toLowerCase());
            })
            .slice(0, 8)
        : [],
    [members, mentionQuery],
  );

  const filteredCanned = useMemo(
    () => cannedResponses.filter((r) => r.title.toLowerCase().includes(cannedSearch.toLowerCase())),
    [cannedResponses, cannedSearch],
  );

  // ── Refs for mention suggestion (stale closure fix) ──────

  const mentionIndexRef = useRef(0);
  const filteredMembersRef = useRef<WorkspaceMember[]>([]);
  mentionIndexRef.current = mentionIndex;
  filteredMembersRef.current = filteredMembers;

  // ── Tiptap Mention Extension ──────────────────────────────

  const mentionExtension = useMemo(
    () =>
      Mention.configure({
        HTMLAttributes: {
          class: "inline-block bg-primary-50 text-primary font-body-semibold rounded px-0.5 mx-0.5",
        },
        renderLabel({ node }) {
          return `@${node.attrs.label}`;
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            return members
              .filter((m) => {
                const name = `${m.firstName} ${m.lastName}`.toLowerCase();
                return name.includes(query.toLowerCase());
              })
              .slice(0, 8);
          },
          render: () => {
            return {
              onStart: (props) => {
                mentionCommandRef.current = props.command;
                setMentionQuery(props.query);
                setMentionIndex(0);
                if (props.clientRect && editorContainerRef.current) {
                  const rect = props.clientRect();
                  const container = editorContainerRef.current.getBoundingClientRect();
                  if (rect) setMentionPos({ top: rect.bottom - container.top, left: rect.left - container.left });
                }
              },
              onUpdate(props) {
                mentionCommandRef.current = props.command;
                setMentionQuery(props.query);
                if (props.clientRect && editorContainerRef.current) {
                  const rect = props.clientRect();
                  const container = editorContainerRef.current.getBoundingClientRect();
                  if (rect) setMentionPos({ top: rect.bottom - container.top, left: rect.left - container.left });
                }
              },
              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  setMentionQuery(null);
                  return true;
                }
                if (props.event.key === "ArrowDown") {
                  setMentionIndex((i) => Math.min(i + 1, filteredMembersRef.current.length - 1));
                  return true;
                }
                if (props.event.key === "ArrowUp") {
                  setMentionIndex((i) => Math.max(i - 1, 0));
                  return true;
                }
                if (props.event.key === "Enter" || props.event.key === "Tab") {
                  const item = filteredMembersRef.current[mentionIndexRef.current];
                  if (item) {
                    mentionCommandRef.current?.({ id: item.userId, label: `${item.firstName} ${item.lastName}` });
                  }
                  return true;
                }
                return false;
              },
              onExit() {
                setMentionQuery(null);
                mentionCommandRef.current = null;
              },
            };
          },
        },
      }),
    [members],
  );

  // ── Refs for editor keydown handler (always current values) ──

  const submitRef = useRef<() => void>(() => {});
  const mentionQueryRef = useRef<string | null>(null);
  const showCannedRef = useRef(false);
  mentionQueryRef.current = mentionQuery;
  showCannedRef.current = showCanned;

  // ── Tiptap Editor ─────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({
        placeholder: t("ticketDetail.commentPlaceholder"),
      }),
      mentionExtension,
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "comment-editor px-3 py-1.5 text-sm text-body outline-none overflow-auto",
        style: "min-height: 60px; max-height: 200px;",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey && mentionQueryRef.current === null && !showCannedRef.current) {
          const e = view.state;
          const $from = e.selection.$from;
          const inList = $from.node($from.depth - 1)?.type.name === "listItem";
          const inCodeBlock = $from.parent.type.name === "codeBlock";
          if (inList || inCodeBlock) return false; // let Tiptap handle it

          event.preventDefault();
          submitRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: () => {
      checkCannedTrigger();
    },
  }, [mentionExtension]);

  // ── Canned Response Logic ─────────────────────────────────

  const checkCannedTrigger = useCallback(() => {
    if (!editor || !editor.view || cannedResponses.length === 0) return;

    const { state } = editor;
    const { $from } = state.selection;
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const slashMatch = textBefore.match(/(^|\s)\/([^\s]*)$/);

    if (slashMatch) {
      setCannedSearch(slashMatch[2]);
      setShowCanned(true);
      setCannedIndex(0);
      // Get cursor position for popup
      if (editorContainerRef.current) {
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        const container = editorContainerRef.current.getBoundingClientRect();
        setCannedPos({ top: coords.bottom - container.top, left: coords.left - container.left });
      }
    } else {
      setShowCanned(false);
    }
  }, [editor, cannedResponses.length]);

  const insertCannedResponse = useCallback(
    (response: CannedResponse) => {
      if (!editor || !editor.view) return;

      const { state } = editor;
      const { $from } = state.selection;
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const slashPos = textBefore.lastIndexOf("/");

      if (slashPos >= 0) {
        const from = $from.start() + slashPos;
        const to = $from.pos;
        editor.chain().focus().deleteRange({ from, to }).insertContent(response.content).run();
      }

      setShowCanned(false);
    },
    [editor],
  );

  // ── Keyboard handling for canned responses ────────────────

  useEffect(() => {
    if (!editor) return;

    let editorDom: HTMLElement;
    try { editorDom = editor.view.dom; } catch { return; }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showCanned || filteredCanned.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCannedIndex((i) => Math.min(i + 1, filteredCanned.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCannedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertCannedResponse(filteredCanned[cannedIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowCanned(false);
        return;
      }
    };

    editorDom.addEventListener("keydown", handleKeyDown, true);
    return () => editorDom.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, showCanned, filteredCanned, cannedIndex, insertCannedResponse]);

  // ── Submit handlers ───────────────────────────────────────

  const getContent = useCallback((): string => {
    if (!editor) return "";
    const html = editor.getHTML();
    if (html === "<p></p>") return "";
    // Convert mention nodes to @[Name](userId) for backend
    return html.replace(
      /<span[^>]*data-type="mention"[^>]*data-id="([^"]*)"[^>]*data-label="([^"]*)"[^>]*>[^<]*<\/span>/g,
      '@[$2]($1)',
    );
  }, [editor]);

  const editorIsEmpty = useCallback((): boolean => {
    if (!editor) return true;
    return editor.isEmpty;
  }, [editor]);

  const handleSubmit = useCallback(() => {
    const content = getContent();
    if (!content) return;
    onSubmit(content);
    editor?.commands.clearContent();
    setShowSendMenu(false);
  }, [editor, getContent, onSubmit]);

  const handleSubmitAndResolve = useCallback(() => {
    const content = getContent();
    if (!content) return;
    onSubmitAndResolve?.(content);
    editor?.commands.clearContent();
    setShowSendMenu(false);
  }, [editor, getContent, onSubmitAndResolve]);

  // Keep submitRef in sync with handleSubmit
  useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

  // ── Send menu click outside ───────────────────────────────

  useEffect(() => {
    if (!showSendMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sendMenuRef.current && !sendMenuRef.current.contains(e.target as Node)) {
        setShowSendMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSendMenu]);

  // ── Toolbar state ─────────────────────────────────────────

  const [active, setActive] = useState({ bold: false, italic: false, strike: false, code: false, codeBlock: false, bulletList: false, orderedList: false });

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

  // ── Toolbar button ────────────────────────────────────────

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
    <div>
      {/* Editor with toolbar */}
      <div className="relative border border-border-input rounded-lg bg-surface" ref={editorContainerRef}>
        {mentionQuery !== null && filteredMembers.length > 0 && mentionPos && (
          <div
            className="absolute bg-surface border border-border-input rounded-lg shadow-lg w-64 max-h-40 overflow-auto z-50"
            style={{ top: mentionPos.top + 4, left: mentionPos.left }}
          >
            {filteredMembers.map((m, i) => (
              <button
                key={m.userId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  mentionCommandRef.current?.({ id: m.userId, label: `${m.firstName} ${m.lastName}` });
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm cursor-pointer",
                  i === mentionIndex
                    ? "bg-surface-active text-primary"
                    : "text-body hover:bg-surface-hover",
                )}
              >
                <span className="font-body-semibold">{m.firstName} {m.lastName}</span>
                <span className="text-xs text-subtle ml-2">{m.email}</span>
              </button>
            ))}
          </div>
        )}

        {showCanned && filteredCanned.length > 0 && cannedPos && (
          <div
            className="absolute bg-surface border border-border-input rounded-lg shadow-lg w-80 max-h-48 overflow-auto z-50"
            style={{ top: cannedPos.top + 4, left: cannedPos.left }}
          >
            {filteredCanned.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertCannedResponse(r);
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 cursor-pointer",
                  i === cannedIndex
                    ? "bg-surface-active text-primary"
                    : "text-body hover:bg-surface-hover",
                )}
              >
                <span className="text-sm font-body-semibold block">{r.title}</span>
                <span className="text-xs text-subtle block truncate">{r.content}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border-input bg-surface select-none rounded-t-lg">
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

      {/* Contextual hint */}
      {active.bulletList || active.orderedList ? (
        <p className="text-exs text-subtle mt-1">{t("ticketDetail.hintList")}</p>
      ) : active.codeBlock ? (
        <p className="text-exs text-subtle mt-1">{t("ticketDetail.hintCodeBlock")}</p>
      ) : null}

      {/* Send buttons */}
      <div className="flex justify-end mt-2">
        <div className="relative" ref={sendMenuRef}>
          <div className="flex">
            <Button
              size="sm"
              loading={loading}
              onClick={handleSubmit}
              disabled={editorIsEmpty()}
              className={canResolve ? "!rounded-r-none !border-r-0" : ""}
            >
              {t("ticketDetail.send")}
            </Button>
            {canResolve && (
              <button
                type="button"
                onClick={() => !editorIsEmpty() && setShowSendMenu(!showSendMenu)}
                className={clsx(
                  "flex items-center px-1.5 text-white rounded-r-button transition-colors",
                  editorIsEmpty() ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary-hover cursor-pointer",
                )}
              >
                <svg className={clsx("w-3 h-3 transition-transform", showSendMenu && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showSendMenu && (
            <div className="absolute top-full mt-1 right-0 z-50">
              <button
                type="button"
                onClick={handleSubmitAndResolve}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-body-semibold text-white bg-primary hover:bg-primary-hover rounded-button cursor-pointer transition-colors shadow-lg whitespace-nowrap"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t("ticketDetail.sendAndResolve")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
