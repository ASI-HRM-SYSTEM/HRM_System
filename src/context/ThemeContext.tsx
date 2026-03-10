import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  colorScheme: 'default' | 'ocean' | 'forest' | 'sunset' | 'minimal';
  setColorScheme: (scheme: 'default' | 'ocean' | 'forest' | 'sunset' | 'minimal') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [colorScheme, setColorScheme] = useState<'default' | 'ocean' | 'forest' | 'sunset' | 'minimal'>('default');
  const [isDark, setIsDark] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    const savedColorScheme = localStorage.getItem('colorScheme') as any || 'default';
    setTheme(savedTheme);
    setColorScheme(savedColorScheme);
  }, []);

  // Update isDark based on theme and system preference
  useEffect(() => {
    let isDarkMode = false;

    if (theme === 'dark') {
      isDarkMode = true;
    } else if (theme === 'light') {
      isDarkMode = false;
    } else if (theme === 'system') {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(isDarkMode);

    // Apply to HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply color scheme
    document.documentElement.setAttribute('data-color-scheme', colorScheme);

    // Save preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorScheme', colorScheme);
  }, [theme, colorScheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setIsDark(mediaQuery.matches);
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
