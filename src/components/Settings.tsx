import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme, colorScheme, setColorScheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Customize your experience with appearance and application preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <section className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  🎨 Appearance
                </h2>
                <p style={{ color: 'var(--text-tertiary)' }} className="text-sm mt-1">
                  Customize how the app looks
                </p>
              </div>
            </div>

            {/* Theme Mode */}
            <div className="mb-8">
              <label className="label">Theme Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className="p-4 rounded-xl border-2 transition-all text-center capitalize"
                    style={{
                      borderColor: theme === t ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: theme === t ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                      color: theme === t ? 'var(--color-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <div className="text-2xl mb-2">
                      {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '⚙️'}
                    </div>
                    <div className="font-medium text-sm">{t}</div>
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--text-tertiary)' }} className="text-xs mt-3">
                Current mode: {isDark ? 'Dark' : 'Light'}
              </p>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="label">Color Scheme</label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {(['default', 'ocean', 'forest', 'sunset', 'minimal'] as const).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className="p-3 rounded-xl border-2 transition-all text-center capitalize"
                    style={{
                      borderColor: colorScheme === scheme ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: colorScheme === scheme ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                      color: colorScheme === scheme ? 'var(--color-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <div className="text-lg mb-1">
                      {scheme === 'default' && '⚡'}
                      {scheme === 'ocean' && '🌊'}
                      {scheme === 'forest' && '🌲'}
                      {scheme === 'sunset' && '🌅'}
                      {scheme === 'minimal' && '⚪'}
                    </div>
                    <div className="font-medium text-xs">{scheme}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                📺 Display
              </h2>
              <p style={{ color: 'var(--text-tertiary)' }} className="text-sm mt-1">
                Adjust display preferences
              </p>
            </div>

            {/* Font Size */}
            <div className="mb-6">
              <label className="label mb-3">Font Size</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className="px-4 py-2 rounded-lg border transition-all capitalize"
                    style={{
                      borderColor: fontSize === size ? 'var(--color-primary)' : 'var(--border-color)',
                      backgroundColor: fontSize === size ? 'var(--color-primary)' : 'var(--bg-secondary)',
                      color: fontSize === size ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div>
                <label className="label mb-0">Compact Mode</label>
                <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
                  Reduce spacing and padding throughout the app
                </p>
              </div>
              <button
                onClick={() => setCompactMode(!compactMode)}
                className="w-12 h-6 rounded-full transition-all relative"
                style={{
                  backgroundColor: compactMode ? 'var(--color-primary)' : 'var(--border-color)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
                  style={{
                    transform: compactMode ? 'translateX(24px)' : 'translateX(2px)',
                  }}
                />
              </button>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                🔔 Notifications
              </h2>
              <p style={{ color: 'var(--text-tertiary)' }} className="text-sm mt-1">
                Control notification preferences
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Email Notifications', desc: 'Receive updates via email' },
                { label: 'In-App Alerts', desc: 'Show alerts within the application' },
                { label: 'Desktop Notifications', desc: 'Browser desktop notifications' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div>
                    <label className="label mb-0">{item.label}</label>
                    <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className="w-12 h-6 rounded-full transition-all relative"
                    style={{
                      backgroundColor: notifications ? 'var(--color-primary)' : 'var(--border-color)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
                      style={{
                        transform: notifications ? 'translateX(24px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* About Section */}
          <section className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                ℹ️ About
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>App Version</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>2.0.0</span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Updated</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>March 10, 2026</span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Theme System</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Modern Dynamic</span>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="btn-secondary flex-1">📝 Privacy Policy</button>
            <button className="btn-secondary flex-1">❓ Help & Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
