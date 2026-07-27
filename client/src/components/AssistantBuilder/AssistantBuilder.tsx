import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgentPanelProvider, useAgentPanelContext } from '~/Providers/AgentPanelContext';
import { Panel } from '~/common';
import { useLocalize } from '~/hooks';
import AgentPanel from '~/components/SidePanel/Agents/AgentPanel';
import VersionPanel from '~/components/SidePanel/Agents/Version/VersionPanel';
import BuilderNav from './BuilderNav';

function BuilderContent() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const params = useParams();
  const { activePanel, setActivePanel, agent_id } = useAgentPanelContext();

  const handleNavigate = useCallback(
    (panel: Panel) => {
      setActivePanel(panel);
    },
    [setActivePanel],
  );

  return (
    <div className="flex h-full">
      <BuilderNav activePanel={activePanel} onNavigate={handleNavigate} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agents')}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {agent_id
                  ? localize('com_agents_edit_agent')
                  : localize('com_agents_create_agent')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activePanel === Panel.builder && localize('com_agents_config_description')}
                {activePanel === Panel.model && localize('com_agents_model_description')}
                {activePanel === Panel.advanced && localize('com_agents_advanced_description')}
                {activePanel === Panel.version && localize('com_agents_version_description')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activePanel === Panel.version ? <VersionPanel /> : <AgentPanel />}
        </div>
      </div>
    </div>
  );
}

export default function AssistantBuilder() {
  return (
    <AgentPanelProvider>
      <BuilderContent />
    </AgentPanelProvider>
  );
}
