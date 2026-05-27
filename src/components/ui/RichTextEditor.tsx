"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const PROSE_CLASSES =
  "[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-0.5 [&_p:not(:last-child)]:mb-1";

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[96px] px-3 py-2 text-sm focus:outline-none",
        "data-placeholder": placeholder,
      },
    },
  });

  // Sync when the external value changes (e.g. when the parent finding changes)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normalizedValue = value || "";
    if (currentHtml === normalizedValue) return;
    // Both effectively empty — avoid an unnecessary reset
    if (!normalizedValue && currentHtml === "<p></p>") return;
    editor.commands.setContent(normalizedValue, false, { preserveWhitespace: "full" });
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  // Read-only display mode
  if (!editable) {
    return (
      <div
        className={`text-sm text-gray-900 bg-gray-50 rounded p-3 ${PROSE_CLASSES}`}
      >
        <EditorContent editor={editor} />
      </div>
    );
  }

  const ToolbarBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        // Prevent the editor from losing focus when clicking toolbar buttons
        e.preventDefault();
        onClick();
      }}
      className={`px-2 py-0.5 text-sm rounded hover:bg-gray-200 transition-colors ${
        active ? "bg-gray-200" : ""
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 bg-gray-50 flex-wrap">
        <ToolbarBtn
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarBtn
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <span className="text-xs font-mono">•≡</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <span className="text-xs font-mono">1≡</span>
        </ToolbarBtn>
      </div>
      {/* Editor area */}
      <div className={PROSE_CLASSES}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
