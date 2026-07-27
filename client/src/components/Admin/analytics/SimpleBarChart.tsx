import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLocalize } from '~/hooks';

export default function SimpleBarChart({
  data,
  dataKey = 'value',
  color = '#22c55e',
  height = 200,
}: {
  data: { date: string; value: number }[];
  dataKey?: string;
  color?: string;
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
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: unknown) => {
            const d = new Date(val as string);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#f3f4f6',
          }}
          formatter={(value: unknown) => [(value as number).toLocaleString(), '']}
          labelFormatter={(label: unknown) => new Date(label as string).toLocaleDateString()}
        />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
