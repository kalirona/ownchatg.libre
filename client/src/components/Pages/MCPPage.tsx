import PageLayout from '~/components/PageLayout';
import MCPBuilderPanel from '~/components/SidePanel/MCPBuilder/MCPBuilderPanel';

export default function MCPPage() {
  return (
    <PageLayout title="MCP" description="Model Context Protocol server management.">
      <MCPBuilderPanel />
    </PageLayout>
  );
}
