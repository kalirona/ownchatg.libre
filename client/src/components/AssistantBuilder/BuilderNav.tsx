import { Panel } from '~/common';
import { useLocalize } from '~/hooks';

interface BuilderSection {
  id: Panel;
  icon: React.ReactNode;
  label: string;
}

export default function BuilderNav({
  activePanel,
  onNavigate,
}: {
  activePanel: Panel;
  onNavigate: (panel: Panel) => void;
}) {
  const localize = useLocalize();

  const sections: BuilderSection[] = [
    {
      id: Panel.builder,
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: localize('com_agents_config'),
    },
    {
      id: Panel.model,
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: localize('com_ui_model'),
    },
    {
      id: Panel.advanced,
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      label: localize('com_ui_advanced'),
    },
    {
      id: Panel.version,
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: localize('com_ui_version_history'),
    },
  ];

  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {localize('com_ui_sections')}
        </h2>
      </div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onNavigate(section.id)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            activePanel === section.id
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          {section.icon}
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}
