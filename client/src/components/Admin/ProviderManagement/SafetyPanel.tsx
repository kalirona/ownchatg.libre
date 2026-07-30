export default function SafetyPanel() {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Safety & Moderation</h2>
      <p className="mb-4 text-xs text-gray-500">Configure content moderation, safety filters, and abuse detection rules for all providers.</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-medium">Moderation Providers</h3>
          <p className="text-xs text-gray-500">Assign one or more moderation providers (e.g., OpenAI Moderation, Azure Content Safety) to scan all inbound and outbound content.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-medium">Safety Filters</h3>
          <p className="text-xs text-gray-500">Set thresholds for hate, harassment, self-harm, sexual, and violence content categories. Content exceeding thresholds is blocked or flagged for review.</p>
        </div>
      </div>
    </div>
  );
}
