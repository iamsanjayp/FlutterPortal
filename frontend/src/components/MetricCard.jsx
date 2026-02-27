export default function MetricCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
    const colorClasses = {
        blue: {
            bg: 'from-blue-500 to-blue-600',
            icon: 'bg-blue-100 text-blue-600',
            text: 'text-blue-600'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            icon: 'bg-purple-100 text-purple-600',
            text: 'text-purple-600'
        },
        green: {
            bg: 'from-green-500 to-green-600',
            icon: 'bg-green-100 text-green-600',
            text: 'text-green-600'
        },
        orange: {
            bg: 'from-orange-500 to-orange-600',
            icon: 'bg-orange-100 text-orange-600',
            text: 'text-orange-600'
        },
        red: {
            bg: 'from-red-500 to-red-600',
            icon: 'bg-red-100 text-red-600',
            text: 'text-red-600'
        },
        indigo: {
            bg: 'from-indigo-500 to-indigo-600',
            icon: 'bg-indigo-100 text-indigo-600',
            text: 'text-indigo-600'
        }
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-lg ${colors.icon}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
}
