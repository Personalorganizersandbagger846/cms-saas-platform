import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Save,
  Globe,
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading1,
  ImageIcon,
  Code2,
  Quote,
  List,
  Minus,
  AlertTriangle,
  Video,
  FileIcon,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Block Types ──────────────
interface ContentBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

const blockTypes = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'code', label: 'Code', icon: Code2 },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'list', label: 'List', icon: List },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'callout', label: 'Callout', icon: AlertTriangle },
  { type: 'file', label: 'File', icon: FileIcon },
];

// ─── Sortable Block ───────────
function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: ContentBlock;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:bg-gray-800 dark:border-gray-700"
    >
      <button
        className="mt-1 cursor-grab touch-none text-gray-300 hover:text-gray-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <BlockEditor block={block} onUpdate={onUpdate} />
      </div>
      <button
        onClick={() => onDelete(block.id)}
        className="mt-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Block Editor ─────────────
function BlockEditor({
  block,
  onUpdate,
}: {
  block: ContentBlock;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
}) {
  const update = (key: string, value: unknown) => {
    onUpdate(block.id, { ...block.data, [key]: value });
  };

  switch (block.type) {
    case 'paragraph':
      return (
        <textarea
          className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:outline-none placeholder-gray-400"
          rows={3}
          placeholder="Start writing..."
          value={(block.data.text as string) ?? ''}
          onChange={(e) => update('text', e.target.value)}
        />
      );

    case 'heading':
      return (
        <div className="space-y-2">
          <select
            className="rounded border border-gray-200 bg-transparent px-2 py-1 text-xs dark:border-gray-600"
            value={(block.data.level as number) ?? 2}
            onChange={(e) => update('level', Number(e.target.value))}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
          <input
            className="w-full bg-transparent text-lg font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-400"
            placeholder="Heading text..."
            value={(block.data.text as string) ?? ''}
            onChange={(e) => update('text', e.target.value)}
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2">
          <input
            className="w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-600 focus:outline-none"
            placeholder="Image URL..."
            value={(block.data.url as string) ?? ''}
            onChange={(e) => update('url', e.target.value)}
          />
          <input
            className="w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-600 focus:outline-none"
            placeholder="Alt text..."
            value={(block.data.alt as string) ?? ''}
            onChange={(e) => update('alt', e.target.value)}
          />
          {block.data.url && (
            <img
              src={block.data.url as string}
              alt={(block.data.alt as string) ?? ''}
              className="max-h-48 rounded"
            />
          )}
        </div>
      );

    case 'video':
      return (
        <input
          className="w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-600 focus:outline-none"
          placeholder="Video URL (YouTube, Vimeo, etc.)..."
          value={(block.data.url as string) ?? ''}
          onChange={(e) => update('url', e.target.value)}
        />
      );

    case 'code':
      return (
        <div className="space-y-2">
          <input
            className="rounded border border-gray-200 bg-transparent px-2 py-1 text-xs dark:border-gray-600"
            placeholder="Language"
            value={(block.data.language as string) ?? ''}
            onChange={(e) => update('language', e.target.value)}
          />
          <textarea
            className="w-full resize-none rounded bg-gray-900 p-3 font-mono text-sm text-green-400 focus:outline-none"
            rows={6}
            placeholder="// Code here..."
            value={(block.data.code as string) ?? ''}
            onChange={(e) => update('code', e.target.value)}
          />
        </div>
      );

    case 'quote':
      return (
        <div className="border-l-4 border-primary-500 pl-4">
          <textarea
            className="w-full resize-none bg-transparent text-sm italic text-gray-700 dark:text-gray-300 focus:outline-none placeholder-gray-400"
            rows={2}
            placeholder="Quote text..."
            value={(block.data.text as string) ?? ''}
            onChange={(e) => update('text', e.target.value)}
          />
          <input
            className="w-full bg-transparent text-xs text-gray-500 focus:outline-none"
            placeholder="— Attribution"
            value={(block.data.attribution as string) ?? ''}
            onChange={(e) => update('attribution', e.target.value)}
          />
        </div>
      );

    case 'list':
      return (
        <div className="space-y-2">
          <select
            className="rounded border border-gray-200 bg-transparent px-2 py-1 text-xs dark:border-gray-600"
            value={(block.data.style as string) ?? 'unordered'}
            onChange={(e) => update('style', e.target.value)}
          >
            <option value="unordered">Unordered</option>
            <option value="ordered">Ordered</option>
          </select>
          <textarea
            className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:outline-none placeholder-gray-400"
            rows={4}
            placeholder="One item per line..."
            value={(block.data.items as string) ?? ''}
            onChange={(e) => update('items', e.target.value)}
          />
        </div>
      );

    case 'divider':
      return <hr className="border-gray-300 dark:border-gray-600 my-2" />;

    case 'callout':
      return (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
          <textarea
            className="w-full resize-none bg-transparent text-sm text-yellow-800 dark:text-yellow-200 focus:outline-none placeholder-yellow-500"
            rows={2}
            placeholder="Callout text..."
            value={(block.data.text as string) ?? ''}
            onChange={(e) => update('text', e.target.value)}
          />
        </div>
      );

    case 'file':
      return (
        <input
          className="w-full rounded border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-600 focus:outline-none"
          placeholder="File URL..."
          value={(block.data.url as string) ?? ''}
          onChange={(e) => update('url', e.target.value)}
        />
      );

    default:
      return <p className="text-sm text-gray-400">Unknown block type: {block.type}</p>;
  }
}

// ─── Main Editor ──────────────
export default function ContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Load existing content
  const { isLoading } = useQuery({
    queryKey: ['content', id],
    queryFn: () => contentApi.get(id!),
    enabled: !isNew,
    onSuccess: (res: { data: { title: string; slug: string; blocks: ContentBlock[] } }) => {
      setTitle(res.data.title);
      setSlug(res.data.slug);
      setBlocks(res.data.blocks ?? []);
    },
  });

  // Save
  const saveMutation = useMutation({
    mutationFn: (data: unknown) =>
      isNew ? contentApi.create(data) : contentApi.update(id!, data),
    onSuccess: (res) => {
      toast.success(isNew ? 'Content created' : 'Content saved');
      queryClient.invalidateQueries({ queryKey: ['content'] });
      if (isNew) navigate(`/content/${res.data.id}/edit`, { replace: true });
    },
    onError: () => toast.error('Failed to save'),
  });

  const publishMutation = useMutation({
    mutationFn: (contentId: string) => contentApi.publish(contentId),
    onSuccess: () => {
      toast.success('Content published!');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: () => toast.error('Failed to publish'),
  });

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      data: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowBlockPicker(false);
  };

  const updateBlock = useCallback((blockId: string, data: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, data } : b)));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleSave = () => {
    saveMutation.mutate({ title, slug, blocks });
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/content')}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        {!isNew && (
          <button
            onClick={() => publishMutation.mutate(id!)}
            disabled={publishMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-green-500 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Globe className="h-4 w-4" /> Publish
          </button>
        )}
      </div>

      {/* Title & Slug */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
        <input
          className="w-full bg-transparent text-3xl font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-300"
          placeholder="Untitled"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (isNew) {
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, ''),
              );
            }
          }}
        />
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>/</span>
          <input
            className="flex-1 bg-transparent focus:outline-none text-gray-600 dark:text-gray-300"
            placeholder="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>

      {/* Block Editor */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block */}
      <div className="relative">
        <button
          onClick={() => setShowBlockPicker(!showBlockPicker)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors dark:border-gray-600"
        >
          <Plus className="h-5 w-5" /> Add Block
        </button>
        {showBlockPicker && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-20 grid grid-cols-5 gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:bg-gray-800 dark:border-gray-700">
            {blockTypes.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <bt.icon className="h-5 w-5 text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{bt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
