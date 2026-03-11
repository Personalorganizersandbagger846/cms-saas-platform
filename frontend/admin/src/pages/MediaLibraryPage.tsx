import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api';
import {
  Upload,
  Grid3X3,
  List,
  FolderPlus,
  Search,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
  Trash2,
  Copy,
  Loader2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const iconForMime = (mime: string) => {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Film;
  if (mime.startsWith('audio/')) return Music;
  if (mime.includes('pdf') || mime.includes('document')) return FileText;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['media', { search }],
    queryFn: () => mediaApi.list(search ? { search } : undefined),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
    onSuccess: () => {
      toast.success('File uploaded');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      toast.success('File deleted');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const items = data?.data?.data ?? [];

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => uploadMutation.mutate(file));
    },
    [uploadMutation],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => uploadMutation.mutate(file));
    e.target.value = '';
  };

  const selectedItem = items.find(
    (i: { id: string }) => i.id === selected,
  ) as Record<string, unknown> | undefined;

  return (
    <div className="flex h-full gap-6">
      {/* Main area */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="text-sm text-gray-500">{items.length} files</p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
              <Upload className="h-4 w-4" /> Upload
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,video/*,audio/*,application/pdf"
              />
            </label>
            <button className="rounded-lg border border-gray-300 p-2.5 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
              <FolderPlus className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-300 dark:border-gray-600 p-0.5">
            <button
              onClick={() => setView('grid')}
              className={clsx(
                'rounded-md p-1.5',
                view === 'grid'
                  ? 'bg-gray-200 dark:bg-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              <Grid3X3 className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => setView('list')}
              className={clsx(
                'rounded-md p-1.5',
                view === 'list'
                  ? 'bg-gray-200 dark:bg-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              <List className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Drop zone / Content */}
        <div
          className={clsx(
            'rounded-xl border-2 border-dashed transition-colors min-h-[400px]',
            dragging
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10'
              : 'border-transparent',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Upload className="h-10 w-10 mb-3" />
              <p className="text-lg font-medium">Drop files here or click Upload</p>
              <p className="text-sm">Supports images, videos, audio, and documents</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
              {items.map(
                (item: {
                  id: string;
                  filename: string;
                  mimeType: string;
                  url: string;
                  size: number;
                }) => {
                  const Icon = iconForMime(item.mimeType);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelected(item.id === selected ? null : item.id)}
                      className={clsx(
                        'group relative flex flex-col items-center rounded-lg border p-3 transition-all hover:shadow-sm',
                        item.id === selected
                          ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                      )}
                    >
                      {item.mimeType.startsWith('image/') ? (
                        <div className="aspect-square w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                          <Icon className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <p className="mt-2 w-full truncate text-center text-xs text-gray-600 dark:text-gray-400">
                        {item.filename}
                      </p>
                      <p className="text-xs text-gray-400">{formatSize(item.size)}</p>
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map(
                (item: {
                  id: string;
                  filename: string;
                  mimeType: string;
                  url: string;
                  size: number;
                  createdAt: string;
                }) => {
                  const Icon = iconForMime(item.mimeType);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelected(item.id === selected ? null : item.id)}
                      className={clsx(
                        'flex w-full items-center gap-4 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        item.id === selected && 'bg-primary-50 dark:bg-primary-900/10',
                      )}
                    >
                      {item.mimeType.startsWith('image/') ? (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                          <Icon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.filename}
                        </p>
                        <p className="text-xs text-gray-400">{item.mimeType}</p>
                      </div>
                      <p className="text-sm text-gray-500">{formatSize(item.size)}</p>
                      <p className="text-sm text-gray-400 hidden md:block">
                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>

        {uploadMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
          </div>
        )}
      </div>

      {/* Detail sidebar */}
      {selectedItem && (
        <aside className="w-72 shrink-0 space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-800 dark:border-gray-700 hidden lg:block">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Details</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {(selectedItem.mimeType as string).startsWith('image/') && (
            <img
              src={selectedItem.url as string}
              alt={selectedItem.filename as string}
              className="w-full rounded"
            />
          )}
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-400">Filename</dt>
              <dd className="text-gray-900 dark:text-white truncate">
                {selectedItem.filename as string}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Type</dt>
              <dd className="text-gray-900 dark:text-white">{selectedItem.mimeType as string}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Size</dt>
              <dd className="text-gray-900 dark:text-white">
                {formatSize(selectedItem.size as number)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Uploaded</dt>
              <dd className="text-gray-900 dark:text-white">
                {format(new Date(selectedItem.createdAt as string), 'MMM d, yyyy HH:mm')}
              </dd>
            </div>
          </dl>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedItem.url as string);
                toast.success('URL copied');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Copy className="h-3.5 w-3.5" /> Copy URL
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this file?'))
                  deleteMutation.mutate(selectedItem.id as string);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
