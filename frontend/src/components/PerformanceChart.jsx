import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PerformanceChart({ data, title = "Level-wise Performance" }) {
    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-medium text-gray-900 mb-2">{payload[0].payload.name}</p>
                    <p className="text-sm text-blue-600">
                        Completion: <strong>{payload[0].value}%</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                        Students: <strong>{payload[0].payload.students}</strong>
                    </p>
                    {payload[0].payload.avg_score && (
                        <p className="text-sm text-gray-600">
                            Avg Score: <strong>{payload[0].payload.avg_score}%</strong>
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#d1d5db' }}
                        label={{ value: 'Completion %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                    />
                    <Bar
                        dataKey="completion"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        name="Completion Rate (%)"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
