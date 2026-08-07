import { useContext, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { ThemeContext } from '@librechat/client';
import PageLayout from '~/components/PageLayout';
import { ThemeSelector, LangSelector } from '~/components/Nav/SettingsTabs/General/Selectors';
import FontSizeSelector from '~/components/Nav/SettingsTabs/Chat/FontSizeSelector';
import store from '~/store';
import { useLocalize } from '~/hooks';

export default function AppearancePage() {
  const localize = useLocalize();
  const { theme, setTheme } = useContext(ThemeContext) as {
    theme: string;
    setTheme: (value: string) => void;
  };
  const [langcode, setLangcode] = useRecoilState(store.lang);

  const handleThemeChange = useCallback(
    (value: string) => setTheme(value),
    [setTheme],
  );

  const handleLangChange = useCallback(
    (value: string) => {
      const userLang =
        value === 'auto' ? navigator.language || navigator.languages?.[0] || 'en-US' : value;
      requestAnimationFrame(() => {
        document.documentElement.lang = userLang;
      });
      setLangcode(userLang);
    },
    [setLangcode],
  );

  return (
    <PageLayout title="Appearance">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border-light p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">Theme</p>
          <ThemeSelector theme={theme} onChange={handleThemeChange} />
        </div>
        <div className="rounded-lg border border-border-light p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">Font Size</p>
          <FontSizeSelector />
        </div>
        <div className="rounded-lg border border-border-light p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">Language</p>
          <LangSelector langcode={langcode} onChange={handleLangChange} />
        </div>
      </div>
    </PageLayout>
  );
}
