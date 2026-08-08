import { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import CannedResponseInserter from "@modules/canned-response/components/CannedResponseInserter";
import { CannedResponse } from "@modules/canned-response/services/canned-response.service";

interface Props {
  members: WorkspaceMember[];
  loading: boolean;
  onSubmit: (content: string) => void;
  onSubmitAndResolve?: (content: string) => void;
  canResolve?: boolean;
  cannedResponses?: CannedResponse[];
}

export default function CommentInput({ members, loading, onSubmit, onSubmitAndResolve, canResolve = false, cannedResponses = [] }: Props) {
  const { t } = useTranslation();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showCanned, setShowCanned] = useState(false);
  const [cannedSearch, setCannedSearch] = useState("");
  const [cannedIndex, setCannedIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter((m) => {
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    return name.includes(mentionSearch.toLowerCase());
  });

  const filteredCanned = cannedResponses.filter((r) =>
    r.title.toLowerCase().includes(cannedSearch.toLowerCase()),
  );

  const checkForMention = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType !== Node.TEXT_NODE) {
      setShowMentions(false);
      setShowCanned(false);
      return;
    }

    const text = node.textContent || "";
    const cursor = range.startOffset;
    const textBeforeCursor = text.substring(0, cursor);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
      setShowCanned(false);
      return;
    } else {
      setShowMentions(false);
    }

    const slashMatch = textBeforeCursor.match(/(^|\s)\/([^\s]*)$/);
    if (slashMatch && cannedResponses.length > 0) {
      setCannedSearch(slashMatch[2]);
      setShowCanned(true);
      setCannedIndex(0);
    } else {
      setShowCanned(false);
    }
  }, [cannedResponses.length]);

  const insertMention = useCallback(
    (member: WorkspaceMember) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;

      if (node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent || "";
      const cursor = range.startOffset;
      const textBeforeCursor = text.substring(0, cursor);
      const atPos = textBeforeCursor.lastIndexOf("@");

      if (atPos === -1) return;

      const displayName = `${member.firstName} ${member.lastName}`;

      // Split the text node
      const before = text.substring(0, atPos);
      const after = text.substring(cursor);

      // Create mention span
      const span = document.createElement("span");
      span.className =
        "inline-block bg-primary-50 text-primary font-body-semibold rounded px-0.5 mx-0.5";
      span.contentEditable = "false";
      span.setAttribute("data-user-id", member.userId);
      span.setAttribute("data-display-name", displayName);
      span.textContent = `@${displayName}`;

      // Create text nodes
      const beforeNode = document.createTextNode(before);
      const afterNode = document.createTextNode("\u00A0" + after);

      // Replace the original text node
      const parent = node.parentNode!;
      parent.insertBefore(beforeNode, node);
      parent.insertBefore(span, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);

      // Set cursor after the mention
      const newRange = document.createRange();
      newRange.setStart(afterNode, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      setShowMentions(false);
    },
    [],
  );

  const insertCannedResponse = useCallback(
    (response: CannedResponse) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;

      if (node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent || "";
      const cursor = range.startOffset;
      const textBeforeCursor = text.substring(0, cursor);
      const slashMatch = textBeforeCursor.match(/(^|\s)\/([^\s]*)$/);

      if (!slashMatch) return;

      const slashPos = textBeforeCursor.lastIndexOf("/");
      const before = text.substring(0, slashPos);
      const after = text.substring(cursor);

      node.textContent = before + response.content + after;

      const newRange = document.createRange();
      newRange.setStart(node, before.length + response.content.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      setShowCanned(false);
    },
    [],
  );

  const handleInput = () => {
    checkForMention();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }

    if (showCanned && filteredCanned.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCannedIndex((i) => Math.min(i + 1, filteredCanned.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCannedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertCannedResponse(filteredCanned[cannedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowCanned(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showMentions && !showCanned) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const buildContent = (): string => {
    const editor = editorRef.current;
    if (!editor) return "";

    let result = "";

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || "";
      } else if (node instanceof HTMLElement) {
        if (node.tagName === "BR") {
          result += "\n";
        } else if (node.hasAttribute("data-user-id")) {
          const userId = node.getAttribute("data-user-id")!;
          const displayName = node.getAttribute("data-display-name")!;
          result += `@[${displayName}](${userId})`;
        } else if (node.tagName === "DIV" || node.tagName === "P") {
          if (result.length > 0 && !result.endsWith("\n")) {
            result += "\n";
          }
          node.childNodes.forEach(walk);
        } else {
          node.childNodes.forEach(walk);
        }
      }
    };

    editor.childNodes.forEach(walk);
    return result.trim();
  };

  const [showSendMenu, setShowSendMenu] = useState(false);
  const sendMenuRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = () => {
    const content = buildContent();
    if (!content) return;
    onSubmit(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setShowSendMenu(false);
  };

  const handleSubmitAndResolve = () => {
    const content = buildContent();
    if (!content) return;
    onSubmitAndResolve?.(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setShowSendMenu(false);
  };

  const isEmpty = () => {
    const editor = editorRef.current;
    if (!editor) return true;
    return editor.textContent?.trim() === "" && !editor.querySelector("span");
  };

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionSearch]);

  useEffect(() => {
    setCannedIndex(0);
  }, [cannedSearch]);

  // Handle paste - strip formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="relative">
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 bg-surface border border-border-input rounded-lg shadow-lg w-64 max-h-40 overflow-auto z-50">
          {filteredMembers.map((m, i) => (
            <button
              key={m.userId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(m);
              }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm cursor-pointer",
                i === mentionIndex
                  ? "bg-surface-active text-primary"
                  : "text-body hover:bg-surface-hover",
              )}
            >
              <span className="font-body-semibold">
                {m.firstName} {m.lastName}
              </span>
              <span className="text-xs text-subtle ml-2">{m.email}</span>
            </button>
          ))}
        </div>
      )}

      {showCanned && filteredCanned.length > 0 && (
        <CannedResponseInserter
          responses={cannedResponses}
          search={cannedSearch}
          selectedIndex={cannedIndex}
          onSelect={insertCannedResponse}
        />
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={() => {
              handleInput();
              forceUpdate((n) => n + 1);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            spellCheck={false}
            className="w-full bg-surface rounded-input border-input transition-all duration-200 outline-none text-body shadow-input border-input-effect px-3 py-1.5 text-sm overflow-auto"
            style={{ minHeight: "60px", maxHeight: "120px" }}
          />
          {isEmpty() && (
            <div className="absolute top-1.5 left-3 text-sm text-subtle pointer-events-none">
              {t("ticketDetail.commentPlaceholder")}
            </div>
          )}
        </div>
        <div className="self-end relative" ref={sendMenuRef}>
          <div className="flex">
            <Button
              size="sm"
              loading={loading}
              onClick={handleSubmit}
              className={canResolve ? "!rounded-r-none !border-r-0" : ""}
            >
              {t("ticketDetail.send")}
            </Button>
            {canResolve && (
              <button
                type="button"
                onClick={() => setShowSendMenu(!showSendMenu)}
                className="flex items-center px-1.5 bg-primary hover:bg-primary-hover text-white rounded-r-button cursor-pointer transition-colors"
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-body-semibold text-white bg-primary hover:bg-primary-hover rounded-button cursor-pointer transition-colors shadow-lg whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
