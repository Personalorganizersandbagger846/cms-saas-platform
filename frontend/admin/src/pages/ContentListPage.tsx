import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

export default function ContentListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['content', { page, search, status: statusFilter }],
    queryFn: () =>
      contentApi.list({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.delete(id),
    onSuccess: () => {
      toast.success('Content deleted');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => contentApi.publish(id),
    onSuccess: () => {
      toast.success('Content published');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => contentApi.unpublish(id),
    onSuccess: () => {
      toast.success('Content unpublished');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  const items = data?.data?.data ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content</h1>
          <p className="text-sm text-gray-500">Manage your articles and pages</p>
        </div>
        <Link
          to="/content/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> New Content
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">In Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="h-10 w-10 mb-2" />
            <p>No content found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map(
                (item: {
                  id: string;
                  title: string;
                  status: string;
                  slug: string;
                  createdAt: string;
                  updatedAt: string;
                }) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => navigate(`/content/${item.id}/edit`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={clsx(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          statusColors[item.status] ?? statusColors.draft,
                        )}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === item.id ? null : item.id);
                          }}
                          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        {openMenu === item.id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/content/${item.id}/edit`);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            {item.status !== 'published' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  publishMutation.mutate(item.id);
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Globe className="h-3.5 w-3.5" /> Publish
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unpublishMutation.mutate(item.id);
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <EyeOff className="h-3.5 w-3.5" /> Unpublish
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/preview/${item.slug}`, '_blank');
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this content?')) {
                                  deleteMutation.mutate(item.id);
                                }
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <span className="text-sm text-gray-500">
              {pagination.total} items · Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
