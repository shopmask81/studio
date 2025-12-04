
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Undo,
  Redo,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { Separator } from './separator';

interface ToolbarProps {
  editor: Editor | null;
}

const EditorToolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    ariaLabel,
  }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    ariaLabel: string;
  }) => (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Toggle>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border bg-card p-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        ariaLabel="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        ariaLabel="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        ariaLabel="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        ariaLabel="Toggle heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        ariaLabel="Toggle heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        ariaLabel="Toggle heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        isActive={editor.isActive('heading', { level: 4 })}
        ariaLabel="Toggle heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        ariaLabel="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        ariaLabel="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-6" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        ariaLabel="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        ariaLabel="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        ariaLabel="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
       <Separator orientation="vertical" className="h-6" />
        <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            ariaLabel="Undo"
        >
            <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            ariaLabel="Redo"
        >
            <Redo className="h-4 w-4" />
        </ToolbarButton>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (richText: string) => void;
  dir?: 'ltr' | 'rtl';
}

export function RichTextEditor({ content, onChange, dir = 'ltr' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
          heading: false, // We configure it separately
      }),
      Underline,
      Heading.configure({
          levels: [1, 2, 3, 4],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[150px] w-full rounded-b-md border border-t-0 bg-background p-4',
      },
    },
  });

  return (
    <div className="flex flex-col" dir={dir}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
