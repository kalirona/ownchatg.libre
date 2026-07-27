import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLocalize } from '~/hooks';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function SimplePieChart({
  data,
  height = 200,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  const localize = useLocalize();
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
        {localize('com_admin_analytics_no_data')}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          dataKey="value"
          nameKey="name"
          label={({ percent }: { percent?: number }) =>
            percent ? `${(percent * 100).toFixed(0)}%` : ''
          }
          labelLine={false}
        >
          {data.map((_entry, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#f3f4f6',
          }}
          formatter={(value: unknown, name: unknown) => [(value as number).toLocaleString(), name as string]}
        />
        <Legend
          wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
