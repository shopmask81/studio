'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Paintbrush,
  ChevronDown,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from './separator';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';

interface ToolbarProps {
  editor: Editor | null;
}

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

const EditorToolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

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
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        ariaLabel="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-6" />
      
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Palette className="h-4 w-4" />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto">
            <input
                type="color"
                onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setColor(event.target.value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-8 h-8 border-none bg-transparent p-0 cursor-pointer"
                title="Text Color"
              />
        </PopoverContent>
      </Popover>

       <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Paintbrush className="h-4 w-4" />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2 w-auto">
             <input
                type="color"
                onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
                value={editor.getAttributes('highlight').color || '#ffffff'}
                className="w-8 h-8 border-none bg-transparent p-0 cursor-pointer"
                title="Highlight Color"
              />
        </PopoverContent>
      </Popover>
      
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
        <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        ariaLabel="Align justify"
      >
        <AlignJustify className="h-4 w-4" />
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
          heading: false, 
      }),
      Underline,
      Heading.configure({
          levels: [1, 2, 3, 4],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[250px] w-full max-w-full rounded-b-md border border-t-0 bg-background p-4',
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
