import { useEffect, useState } from 'react';
import { ThemeSelector } from '@librechat/client';
import type { TStartupConfig, TWhiteLabel } from 'librechat-data-provider';
import { DEFAULT_APP_TITLE, dataService } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import { Banner } from '../Banners';
import Footer from './Footer';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();
  const [branding, setBranding] = useState<TWhiteLabel | null>(null);

  useEffect(() => {
    dataService.getPublicBranding().then(setBranding).catch(() => {});
  }, []);

  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primaryColor) root.style.setProperty('--brand-primary', branding.primaryColor);
    if (branding.secondaryColor) root.style.setProperty('--brand-secondary', branding.secondaryColor);
    if (branding.accentColor) root.style.setProperty('--brand-accent', branding.accentColor);
    if (branding.dashboard?.appTitle) document.title = branding.dashboard.appTitle;
    if (branding.favicon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = branding.favicon;
    }
  }, [branding]);

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-green-600 hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  const bgStyle = branding?.loginPage?.backgroundColor
    ? { backgroundColor: branding.loginPage.backgroundColor }
    : {};
  const bgImageStyle = branding?.loginPage?.backgroundImage
    ? { backgroundImage: `url(${branding.loginPage.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-gray-900" style={{ ...bgStyle, ...bgImageStyle }}>
      <Banner />
      <BlinkAnimation active={isFetching}>
        <div className="mt-6 h-10 w-full bg-cover">
          <img
            src={branding?.logo || 'assets/logo.svg'}
            className="h-full w-full object-contain"
            alt={localize('com_ui_logo', { 0: branding?.dashboard?.appTitle ?? startupConfig?.appTitle ?? DEFAULT_APP_TITLE })}
            style={branding?.dashboard?.logoHeight ? { height: branding.dashboard.logoHeight } : undefined}
          />
        </div>
      </BlinkAnimation>
      <DisplayError />
      <div className="absolute bottom-0 left-0 md:m-4">
        <ThemeSelector />
      </div>

      <main className="flex flex-grow items-center justify-center">
        <div className="w-authPageWidth overflow-hidden bg-white px-6 py-4 dark:bg-gray-900 sm:max-w-md sm:rounded-lg">
          {!hasStartupConfigError && !isFetching && header && (
            <h1
              className="mb-4 text-center text-3xl font-semibold text-black dark:text-white"
              style={{ userSelect: 'none' }}
            >
              {branding?.loginPage?.title || header}
            </h1>
          )}
          {branding?.loginPage?.subtitle && (
            <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {branding.loginPage.subtitle}
            </p>
          )}
          {children}
          {!pathname.includes('2fa') &&
            (pathname.includes('login') || pathname.includes('register')) && (
              <SocialLoginRender startupConfig={startupConfig} />
            )}
        </div>
      </main>
      <Footer startupConfig={startupConfig} />
      {branding?.loginPage?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: branding.loginPage.customCss }} />
      )}
    </div>
  );
}

export default AuthLayout;
