import { Lock, Check, Clock } from 'lucide-react';

const LEVEL_CONFIG = [
    { id: '1A', name: 'Level 1A', type: 'CODE', locked: true, row: 1 },
    { id: '1B', name: 'Level 1B', type: 'CODE', locked: true, row: 1 },
    { id: '1C', name: 'Level 1C', type: 'CODE', locked: true, row: 1 },
    { id: '2A', name: 'Level 2A', type: 'CODE', locked: true, row: 2 },
    { id: '2B', name: 'Level 2B', type: 'CODE', locked: true, row: 2 },
    { id: '2C', name: 'Level 2C', type: 'CODE', locked: true, row: 2 },
    { id: '3A', name: 'Level 3A', type: 'UI', locked: false, row: 3 },
    { id: '3B', name: 'Level 3B', type: 'UI', locked: true, row: 3 },
    { id: '3C', name: 'Level 3C', type: 'UI', locked: true, row: 3 },
    { id: '4A', name: 'Level 4A', type: 'UI', locked: true, row: 4 },
    { id: '4B', name: 'Level 4B', type: 'UI', locked: true, row: 4 },
    { id: '4C', name: 'Level 4C', type: 'UI', locked: true, row: 4 },
    { id: '5A', name: 'Level 5A', type: 'UI', locked: true, row: 5 },
    { id: '5B', name: 'Level 5B', type: 'UI', locked: true, row: 5 },
    { id: '5C', name: 'Level 5C', type: 'UI', locked: true, row: 5 },
];

export default function LevelGrid({ currentLevel = '3A', levelStatus = {}, onLevelClick }) {
    const getLevelStatus = (levelId) => {
        return levelStatus[levelId] || 'not_started';
    };

    const handleLevelClick = (level) => {
        if (!level.locked && onLevelClick) {
            onLevelClick(level.id);
        }
    };

    const getLevelCard = (level) => {
        const status = getLevelStatus(level.id);
        const isActive = level.id === currentLevel && !level.locked;
        const isLocked = level.locked;

        return (
            <div
                key={level.id}
                onClick={() => handleLevelClick(level)}
                className={`
          relative border rounded-lg p-5 transition-all duration-200
          ${isActive && !isLocked
                        ? 'border-gray-900 bg-white cursor-pointer hover:border-gray-700'
                        : isLocked
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-200 bg-white cursor-pointer hover:border-gray-400'
                    }
        `}
                title={isLocked ? 'This level is locked' : `Click to access ${level.name}`}
            >
                {/* Level ID and Type */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isActive && !isLocked ? 'text-gray-900' : 'text-gray-700'}`}>
                        {level.id}
                    </h3>
                    <span className={`
            px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide
            ${level.type === 'CODE' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600'}
          `}>
                        {level.type}
                    </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 text-sm">
                    {isLocked ? (
                        <>
                            <Lock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Locked</span>
                        </>
                    ) : status === 'completed' ? (
                        <>
                            <Check className="w-4 h-4 text-gray-900" />
                            <span className="text-gray-600">Completed</span>
                        </>
                    ) : status === 'in_progress' ? (
                        <>
                            <Clock className="w-4 h-4 text-gray-900" />
                            <span className="text-gray-600">In Progress</span>
                        </>
                    ) : (
                        <span className="text-gray-600">Available</span>
                    )}
                </div>

                {/* Active indicator */}
                {isActive && !isLocked && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gray-900" />
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">All Levels</h2>
                <p className="text-sm text-gray-600">
                    Complete levels to unlock new challenges
                </p>
            </div>

            {/* Level grid */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(row => (
                    <div key={row} className="grid grid-cols-3 gap-3">
                        {LEVEL_CONFIG
                            .filter(level => level.row === row)
                            .map(level => getLevelCard(level))}
                    </div>
                ))}
            </div>

            {/* Simple legend */}
            <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                </div>
            </div>
        </div>
    );
}
