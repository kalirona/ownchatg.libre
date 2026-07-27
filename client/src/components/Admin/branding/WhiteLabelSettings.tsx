import { useState, useRef, useCallback } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetBrandingConfig,
  useUpdateBrandingConfigMutation,
  useResetBrandingConfigMutation,
  useUploadBrandingImageMutation,
  useVerifyBrandingDomainMutation,
  useGetBrandingSSLStatus,
} from '~/data-provider/Branding/queries';

interface BrandingForm {
  logo: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string;
  emailFromName: string;
  emailFromAddress: string;
  loginPageTitle: string;
  loginPageSubtitle: string;
  loginPageBackgroundColor: string;
  loginPageCustomCss: string;
  dashboardAppName: string;
  dashboardAppTitle: string;
  dashboardCustomCss: string;
  footerText: string;
  emailHeaderColor: string;
  emailLogoUrl: string;
  isActive: boolean;
}

const defaultForm: BrandingForm = {
  logo: '', logoDark: '', favicon: '',
  primaryColor: '#16a34a', secondaryColor: '#2563eb', accentColor: '#8b5cf6',
  customDomain: '', emailFromName: '', emailFromAddress: '',
  loginPageTitle: '', loginPageSubtitle: '', loginPageBackgroundColor: '', loginPageCustomCss: '',
  dashboardAppName: '', dashboardAppTitle: '', dashboardCustomCss: '',
  footerText: '', emailHeaderColor: '', emailLogoUrl: '',
  isActive: true,
};

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const localize = useLocalize();
  return (
    <div className="flex items-center gap-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded border border-gray-300 dark:border-gray-600" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
        <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

function LivePreview({ form }: { form: BrandingForm }) {
  const localize = useLocalize();
  return (
    <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{localize('com_branding_preview')}</h3>
      <div className="overflow-hidden rounded-md border" style={{ borderColor: form.primaryColor }}>
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white" style={{ backgroundColor: form.primaryColor }}>
          <div className="h-5 w-5 rounded bg-white/30" />
          <span>{form.dashboardAppName || 'App'}</span>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-3">
            <img src={form.logo || 'assets/logo.svg'} alt="" className="h-8 w-8 rounded object-contain" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{form.dashboardAppTitle || 'Dashboard Title'}</span>
          </div>
          <div className="h-2 w-3/4 rounded" style={{ backgroundColor: form.secondaryColor + '40' }} />
          <div className="h-2 w-1/2 rounded" style={{ backgroundColor: form.accentColor + '40' }} />
          <div className="mt-2 flex gap-2">
            <span className="rounded px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: form.primaryColor }}>{localize('com_branding_primary')}</span>
            <span className="rounded px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: form.secondaryColor }}>{localize('com_branding_secondary')}</span>
            <span className="rounded px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: form.accentColor }}>{localize('com_branding_accent')}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[9px] text-gray-400">{localize('com_branding_preview_desc')}</p>
    </div>
  );
}

function ImageUpload({ label, currentUrl, type, onUpload }: { label: string; currentUrl?: string; type: string; onUpload: (type: string, file: File) => void }) {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onUpload(type, file); e.target.value = ''; }
  };
  return (
    <div className="flex items-center gap-3">
      <label className="block min-w-[120px] text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        {currentUrl && <img src={currentUrl} alt="" className="h-10 w-10 rounded object-contain border" />}
        <button onClick={handleClick} className="rounded bg-gray-100 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">{localize('com_branding_upload')}</button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </div>
    </div>
  );
}

function DomainVerification({ domain }: { domain: string }) {
  const localize = useLocalize();
  const [result, setResult] = useState<{ verified: boolean; token?: string; expected?: string; error?: string } | null>(null);
  const verifyMutation = useVerifyBrandingDomainMutation();
  const handleVerify = async () => {
    if (!domain) return;
    try {
      const res = await verifyMutation.mutateAsync(domain);
      setResult(res);
    } catch { setResult({ verified: false, error: 'Verification failed' }); }
  };
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{localize('com_branding_domain_verification')}</h4>
      <p className="text-xs text-gray-500">{localize('com_branding_domain_verification_desc')}</p>
      <button onClick={handleVerify} disabled={verifyMutation.isLoading || !domain} className="rounded bg-green-500 px-3 py-1.5 text-xs text-white hover:bg-green-600 disabled:opacity-50">{verifyMutation.isLoading ? '...' : localize('com_branding_verify')}</button>
      {result && (
        <div className={`text-xs ${result.verified ? 'text-green-600' : 'text-red-500'}`}>
          {result.verified ? localize('com_branding_domain_verified') : result.error || localize('com_branding_domain_not_verified')}
          {result.expected && <p className="mt-1 text-gray-500">Add TXT record: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{result.expected}</code></p>}
        </div>
      )}
    </div>
  );
}

function SSLCheck({ domain }: { domain: string }) {
  const localize = useLocalize();
  const [checkEnabled, setCheckEnabled] = useState(false);
  const { data, isLoading } = useGetBrandingSSLStatus(domain, checkEnabled);
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{localize('com_branding_ssl')}</h4>
      <button onClick={() => setCheckEnabled(true)} disabled={!domain} className="rounded bg-green-500 px-3 py-1.5 text-xs text-white hover:bg-green-600 disabled:opacity-50">
        {isLoading ? '...' : localize('com_branding_check_ssl')}
      </button>
      {data && (
        <div className="text-xs">
          {data.valid ? (
            <span className="text-green-600">{localize('com_branding_ssl_valid')}</span>
          ) : (
            <span className="text-red-500">{data.error || localize('com_branding_ssl_invalid')}</span>
          )}
          {data.issuer && <p className="mt-1 text-gray-500">Issuer: {data.issuer}</p>}
          {data.expiresInDays != null && <p className="text-gray-500">{localize('com_branding_ssl_expires')}: {data.expiresInDays}d</p>}
        </div>
      )}
    </div>
  );
}

export default function WhiteLabelSettings() {
  const localize = useLocalize();
  const { data: config } = useGetBrandingConfig();
  const updateMutation = useUpdateBrandingConfigMutation();
  const resetMutation = useResetBrandingConfigMutation();
  const uploadMutation = useUploadBrandingImageMutation();

  const [form, setForm] = useState<BrandingForm>(() => {
    if (!config) return defaultForm;
    return {
      logo: config.logo || '', logoDark: config.logoDark || '', favicon: config.favicon || '',
      primaryColor: config.primaryColor || '#16a34a', secondaryColor: config.secondaryColor || '#2563eb', accentColor: config.accentColor || '#8b5cf6',
      customDomain: config.customDomain || '', emailFromName: config.emailFromName || '', emailFromAddress: config.emailFromAddress || '',
      loginPageTitle: config.loginPage?.title || '', loginPageSubtitle: config.loginPage?.subtitle || '',
      loginPageBackgroundColor: config.loginPage?.backgroundColor || '', loginPageCustomCss: config.loginPage?.customCss || '',
      dashboardAppName: config.dashboard?.appName || '', dashboardAppTitle: config.dashboard?.appTitle || '',
      dashboardCustomCss: config.dashboard?.customCss || '',
      footerText: config.emailTemplate?.footerText || '', emailHeaderColor: config.emailTemplate?.headerColor || '',
      emailLogoUrl: config.emailTemplate?.logoUrl || '',
      isActive: config.isActive ?? true,
    };
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  const updateField = (field: keyof BrandingForm, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({
      logo: form.logo, logoDark: form.logoDark, favicon: form.favicon,
      primaryColor: form.primaryColor, secondaryColor: form.secondaryColor, accentColor: form.accentColor,
      customDomain: form.customDomain, emailFromName: form.emailFromName, emailFromAddress: form.emailFromAddress,
      loginPage: { title: form.loginPageTitle, subtitle: form.loginPageSubtitle, backgroundColor: form.loginPageBackgroundColor, customCss: form.loginPageCustomCss },
      dashboard: { appName: form.dashboardAppName, appTitle: form.dashboardAppTitle, customCss: form.dashboardCustomCss },
      emailTemplate: { footerText: form.footerText, headerColor: form.emailHeaderColor, logoUrl: form.emailLogoUrl },
      isActive: form.isActive,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [form, updateMutation]);

  const handleReset = async () => {
    await resetMutation.mutateAsync('');
    setForm(defaultForm);
  };

  const handleUpload = useCallback(async (type: string, file: File) => {
    const res = await uploadMutation.mutateAsync({ type, file });
    if (type === 'logo') updateField('logo', res.url);
    else if (type === 'logoDark') updateField('logoDark', res.url);
    else if (type === 'favicon') updateField('favicon', res.url);
  }, [uploadMutation]);

  const tabs = [
    { id: 'colors', label: 'com_branding_colors' },
    { id: 'logos', label: 'com_branding_logos' },
    { id: 'login', label: 'com_branding_login' },
    { id: 'dashboard', label: 'com_branding_dashboard' },
    { id: 'email', label: 'com_branding_email' },
    { id: 'domain', label: 'com_branding_domain' },
  ];

  const sectionClass = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800';
  const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2 dark:border-gray-700">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`rounded-t px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === t.id ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >{localize(t.label)}</button>
          ))}
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_colors')}</h3>
            <div className="space-y-3">
              <ColorPicker label={localize('com_branding_primary')} value={form.primaryColor} onChange={(v) => updateField('primaryColor', v)} />
              <ColorPicker label={localize('com_branding_secondary')} value={form.secondaryColor} onChange={(v) => updateField('secondaryColor', v)} />
              <ColorPicker label={localize('com_branding_accent')} value={form.accentColor} onChange={(v) => updateField('accentColor', v)} />
            </div>
          </div>
        )}

        {/* Logos Tab */}
        {activeTab === 'logos' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_logos')}</h3>
            <div className="space-y-4">
              <ImageUpload label={localize('com_branding_logo')} currentUrl={form.logo} type="logo" onUpload={handleUpload} />
              <ImageUpload label={localize('com_branding_logo_dark')} currentUrl={form.logoDark} type="logoDark" onUpload={handleUpload} />
              <ImageUpload label={localize('com_branding_favicon')} currentUrl={form.favicon} type="favicon" onUpload={handleUpload} />
            </div>
          </div>
        )}

        {/* Login Tab */}
        {activeTab === 'login' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_login')}</h3>
            <div className="space-y-3">
              <div><label className={labelClass}>{localize('com_branding_login_title')}</label><input className={inputClass} value={form.loginPageTitle} onChange={(e) => updateField('loginPageTitle', e.target.value)} /></div>
              <div><label className={labelClass}>{localize('com_branding_login_subtitle')}</label><input className={inputClass} value={form.loginPageSubtitle} onChange={(e) => updateField('loginPageSubtitle', e.target.value)} /></div>
              <ColorPicker label={localize('com_branding_login_bg_color')} value={form.loginPageBackgroundColor} onChange={(v) => updateField('loginPageBackgroundColor', v)} />
              <ImageUpload label={localize('com_branding_login_bg_image')} currentUrl={config?.loginPage?.backgroundImage} type="backgroundImage" onUpload={handleUpload} />
              <div><label className={labelClass}>{localize('com_branding_custom_css')}</label><textarea className={inputClass} rows={3} value={form.loginPageCustomCss} onChange={(e) => updateField('loginPageCustomCss', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_dashboard')}</h3>
            <div className="space-y-3">
              <div><label className={labelClass}>{localize('com_branding_app_name')}</label><input className={inputClass} value={form.dashboardAppName} onChange={(e) => updateField('dashboardAppName', e.target.value)} /></div>
              <div><label className={labelClass}>{localize('com_branding_app_title')}</label><input className={inputClass} value={form.dashboardAppTitle} onChange={(e) => updateField('dashboardAppTitle', e.target.value)} /></div>
              <div><label className={labelClass}>{localize('com_branding_custom_css')}</label><textarea className={inputClass} rows={3} value={form.dashboardCustomCss} onChange={(e) => updateField('dashboardCustomCss', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_email')}</h3>
            <div className="space-y-3">
              <div><label className={labelClass}>{localize('com_branding_email_from_name')}</label><input className={inputClass} value={form.emailFromName} onChange={(e) => updateField('emailFromName', e.target.value)} /></div>
              <div><label className={labelClass}>{localize('com_branding_email_from_address')}</label><input className={inputClass} value={form.emailFromAddress} onChange={(e) => updateField('emailFromAddress', e.target.value)} /></div>
              <ColorPicker label={localize('com_branding_email_header_color')} value={form.emailHeaderColor} onChange={(v) => updateField('emailHeaderColor', v)} />
              <div><label className={labelClass}>{localize('com_branding_email_logo_url')}</label><input className={inputClass} value={form.emailLogoUrl} onChange={(e) => updateField('emailLogoUrl', e.target.value)} placeholder="URL or upload path" /></div>
              <div><label className={labelClass}>{localize('com_branding_footer')}</label><textarea className={inputClass} rows={2} value={form.footerText} onChange={(e) => updateField('footerText', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Domain Tab */}
        {activeTab === 'domain' && (
          <div className={sectionClass}>
            <h3 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">{localize('com_branding_domain')}</h3>
            <div className="space-y-3">
              <div><label className={labelClass}>{localize('com_branding_custom_domain')}</label><input className={inputClass} value={form.customDomain} onChange={(e) => updateField('customDomain', e.target.value)} placeholder="brand.example.com" /></div>
              <DomainVerification domain={form.customDomain} onVerify={() => {}} />
              <SSLCheck domain={form.customDomain} />
              <p className="text-xs text-gray-400">{localize('com_branding_domain_help')}</p>
            </div>
          </div>
        )}

        {/* Save / Reset */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label className={labelClass}>{localize('com_branding_active')}</label>
            <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">{localize('com_branding_saved')}</span>}
            <button onClick={handleReset} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">{localize('com_branding_reset')}</button>
            <button onClick={handleSave} disabled={updateMutation.isLoading} className="rounded-lg bg-green-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50">{localize('com_branding_save')}</button>
          </div>
        </div>
      </div>

      {/* Live Preview Sidebar */}
      <div className="hidden w-72 shrink-0 lg:block">
        <LivePreview form={form} />
      </div>
    </div>
  );
}
