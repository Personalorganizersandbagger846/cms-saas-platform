import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import {
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Loader2,
  Save,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const tabs = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'site', label: 'Site', icon: Globe },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  });

  const { data: billingData } = useQuery({
    queryKey: ['settings', 'billing'],
    queryFn: settingsApi.billing,
    enabled: activeTab === 'billing',
  });

  const { data: plansData } = useQuery({
    queryKey: ['settings', 'plans'],
    queryFn: settingsApi.plans,
    enabled: activeTab === 'billing',
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => settingsApi.update(key, value),
    onSuccess: () => {
      toast.success('Setting saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Failed to save setting'),
  });

  const settings = settingsData?.data?.data ?? {};
  const billing = billingData?.data;
  const plans = plansData?.data?.data ?? [];

  const getSetting = (key: string, fallback: unknown = '') =>
    (settings as Record<string, { value: unknown }>)[key]?.value ?? fallback;

  const handleUpdate = (key: string, value: unknown) => {
    updateMutation.mutate({ key, value });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500">Manage your CMS configuration</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab navigation */}
        <nav className="flex lg:w-48 lg:flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700',
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
            {/* General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  General Settings
                </h2>
                <SettingField
                  label="Site Name"
                  description="The name of your site"
                  value={getSetting('site_name', '') as string}
                  onSave={(val) => handleUpdate('site_name', val)}
                />
                <SettingField
                  label="Site Description"
                  description="A brief description of your site"
                  value={getSetting('site_description', '') as string}
                  onSave={(val) => handleUpdate('site_description', val)}
                  multiline
                />
                <SettingField
                  label="Default Language"
                  description="Primary content language"
                  value={getSetting('default_language', 'en') as string}
                  onSave={(val) => handleUpdate('default_language', val)}
                />
                <SettingField
                  label="Timezone"
                  description="Used for scheduling and timestamps"
                  value={getSetting('timezone', 'UTC') as string}
                  onSave={(val) => handleUpdate('timezone', val)}
                />
              </div>
            )}

            {/* Site */}
            {activeTab === 'site' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Site Configuration
                </h2>
                <SettingField
                  label="Custom Domain"
                  description="Your site's custom domain"
                  value={getSetting('custom_domain', '') as string}
                  onSave={(val) => handleUpdate('custom_domain', val)}
                />
                <SettingField
                  label="Favicon URL"
                  description="URL to your favicon"
                  value={getSetting('favicon_url', '') as string}
                  onSave={(val) => handleUpdate('favicon_url', val)}
                />
                <SettingToggle
                  label="Enable Comments"
                  description="Allow comments on published content"
                  checked={getSetting('comments_enabled', true) as boolean}
                  onToggle={(val) => handleUpdate('comments_enabled', val)}
                />
                <SettingToggle
                  label="Enable Search Indexing"
                  description="Allow search engines to index your site"
                  checked={getSetting('search_indexing', true) as boolean}
                  onToggle={(val) => handleUpdate('search_indexing', val)}
                />
              </div>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Billing & Plan
                </h2>
                {billing && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <p className="text-sm text-gray-500">Current Plan</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {billing.plan?.name ?? 'Free'}
                    </p>
                    {billing.plan?.price > 0 && (
                      <p className="text-sm text-gray-500">
                        ${billing.plan.price}/month · Next billing{' '}
                        {billing.nextBillingDate ?? 'N/A'}
                      </p>
                    )}
                  </div>
                )}
                <h3 className="font-medium text-gray-900 dark:text-white">Available Plans</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {plans.map(
                    (plan: {
                      id: string;
                      name: string;
                      price: number;
                      features: string[];
                    }) => (
                      <div
                        key={plan.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 p-5 space-y-3"
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                        </p>
                        <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                          {(plan.features ?? []).map((f: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-green-500" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>
                <SettingToggle
                  label="Email Notifications"
                  description="Receive email notifications for important events"
                  checked={getSetting('email_notifications', true) as boolean}
                  onToggle={(val) => handleUpdate('email_notifications', val)}
                />
                <SettingToggle
                  label="Content Published"
                  description="Notify when content is published"
                  checked={getSetting('notify_content_published', true) as boolean}
                  onToggle={(val) => handleUpdate('notify_content_published', val)}
                />
                <SettingToggle
                  label="New Comments"
                  description="Notify when new comments are posted"
                  checked={getSetting('notify_new_comments', true) as boolean}
                  onToggle={(val) => handleUpdate('notify_new_comments', val)}
                />
                <SettingToggle
                  label="New Users"
                  description="Notify when new users register"
                  checked={getSetting('notify_new_users', false) as boolean}
                  onToggle={(val) => handleUpdate('notify_new_users', val)}
                />
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
                <SettingToggle
                  label="Two-Factor Authentication"
                  description="Require 2FA for all admin users"
                  checked={getSetting('require_2fa', false) as boolean}
                  onToggle={(val) => handleUpdate('require_2fa', val)}
                />
                <SettingField
                  label="Session Timeout (minutes)"
                  description="Auto-logout after inactivity"
                  value={String(getSetting('session_timeout', 60))}
                  onSave={(val) => handleUpdate('session_timeout', Number(val))}
                />
                <SettingField
                  label="Max Login Attempts"
                  description="Lock account after failed attempts"
                  value={String(getSetting('max_login_attempts', 5))}
                  onSave={(val) => handleUpdate('max_login_attempts', Number(val))}
                />
                <SettingToggle
                  label="IP Whitelisting"
                  description="Restrict admin access to specific IPs"
                  checked={getSetting('ip_whitelist_enabled', false) as boolean}
                  onToggle={(val) => handleUpdate('ip_whitelist_enabled', val)}
                />
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                <SettingField
                  label="Primary Color"
                  description="Brand color for your site"
                  value={getSetting('primary_color', '#3b82f6') as string}
                  onSave={(val) => handleUpdate('primary_color', val)}
                />
                <SettingField
                  label="Logo URL"
                  description="URL to your site logo"
                  value={getSetting('logo_url', '') as string}
                  onSave={(val) => handleUpdate('logo_url', val)}
                />
                <SettingField
                  label="Custom CSS"
                  description="Additional CSS for your site"
                  value={getSetting('custom_css', '') as string}
                  onSave={(val) => handleUpdate('custom_css', val)}
                  multiline
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Setting Field ────────────
function SettingField({
  label,
  description,
  value: initialValue,
  onSave,
  multiline,
}: {
  label: string;
  description: string;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const changed = value !== initialValue;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <p className="text-xs text-gray-400">{description}</p>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {changed && (
          <button
            onClick={() => onSave(value)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Setting Toggle ───────────
function SettingToggle({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
