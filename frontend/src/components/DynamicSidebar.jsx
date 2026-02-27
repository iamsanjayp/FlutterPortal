import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, LayoutDashboard, Users, AlertCircle, LogOut, BookOpen, Smartphone, Calendar, Activity, FileText } from 'lucide-react';
import { fetchSkills } from '../api/skillApi';

// SubLevelItem Component - Clickable sub-level link
function SubLevelItem({ subLevel, skillSlug, levelNumber, isActive, onClick }) {
    const displayLabel = `${levelNumber}${subLevel.code}`;
    const questionInfo = subLevel.question_types
        ? `(${subLevel.question_types.map(t => `${t.type}:${t.count}`).join(', ')})`
        : `(${subLevel.question_count})`;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 h-[44px] pl-10 text-sm transition-all rounded-lg ${isActive
                ? 'bg-accent-soft text-accent font-medium border-l-[3px] border-l-accent'
                : 'text-text-muted border-l-[3px] border-l-transparent hover:bg-surface hover:text-text-primary'
                }`}
        >
            <span className="flex items-center gap-2 truncate">
                <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
                <span className="truncate">{displayLabel}</span>
            </span>
            <span className="text-[10px] text-text-muted shrink-0 ml-2">{questionInfo}</span>
        </button>
    );
}

// LevelSection Component - Expandable level with sub-levels
function LevelSection({ level, skillSlug, isExpanded, onToggle, activePath, onNavigate }) {
    const levelNumber = level.level_number;

    return (
        <div>
            {/* Level Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 h-[44px] pl-6 text-sm text-text-primary hover:bg-surface transition-colors rounded-lg"
            >
                <span className="flex items-center gap-2 truncate">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" />
                    ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 text-text-muted" />
                    )}
                    <span className="truncate">{level.name}</span>
                </span>
                <span className="text-[10px] text-text-muted shrink-0 ml-2">{level.sub_levels.length} sub</span>
            </button>

            {/* Sub-levels */}
            {isExpanded && (
                <div className="space-y-0.5">
                    {level.sub_levels.map(subLevel => {
                        const path = `/admin/${skillSlug}/${levelNumber}/${subLevel.code}/questions`;
                        const isActive = activePath === path;

                        return (
                            <SubLevelItem
                                key={subLevel.id}
                                subLevel={subLevel}
                                skillSlug={skillSlug}
                                levelNumber={levelNumber}
                                isActive={isActive}
                                onClick={() => onNavigate(path)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// SkillSection Component - Expandable skill with levels
function SkillSection({ skill, isExpanded, onToggle, expandedLevels, onLevelToggle, activePath, onNavigate }) {
    return (
        <div className="border-t border-border-subtle pt-1 mt-1">
            {/* Skill Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 h-[44px] text-sm font-medium text-text-primary hover:bg-surface transition-colors rounded-lg"
            >
                <span className="flex items-center gap-2 truncate">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" />
                    ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 text-text-muted" />
                    )}
                    <span className="truncate">{skill.name}</span>
                </span>
                <span className="text-[10px] text-text-muted shrink-0 ml-2">{skill.levels.length} lvls</span>
            </button>

            {/* Levels */}
            {isExpanded && (
                <div className="mb-1">
                    {skill.levels.map(level => (
                        <LevelSection
                            key={level.id}
                            level={level}
                            skillSlug={skill.slug}
                            isExpanded={expandedLevels.has(level.id)}
                            onToggle={() => onLevelToggle(level.id)}
                            activePath={activePath}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Main DynamicSidebar Component
export default function DynamicSidebar({ role, activePath, onNavigate, onLogout, user }) {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSkills, setExpandedSkills] = useState(new Set());
    const [expandedLevels, setExpandedLevels] = useState(new Set());

    // Static menu items
    const STATIC_MENU = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { id: 'questions', label: 'Questions', icon: BookOpen, path: '/admin/questions' },
        { id: 'scheduling', label: 'Test Slots', icon: Calendar, path: '/admin/scheduling' },
        { id: 'tests', label: 'Live Tests', icon: Activity, path: '/admin/tests' },
        { id: 'users', label: 'Users', icon: Users, path: '/admin/students' },
        { id: 'submissions', label: 'Submissions', icon: FileText, path: '/admin/submissions' },
        { id: 'audit-logs', label: 'Audit Logs', icon: AlertCircle, path: '/admin/audit-logs' },
    ];

    useEffect(() => {
        loadSkills();
    }, []);

    useEffect(() => {
        if (activePath && skills.length > 0) {
            const pathParts = activePath.split('/').filter(Boolean);
            if (pathParts.length >= 4) {
                const [, skillSlug, levelNum] = pathParts;

                const skill = skills.find(s => s.slug === skillSlug);
                if (skill) {
                    setExpandedSkills(prev => new Set(prev).add(skill.id));

                    const level = skill.levels.find(l => l.level_number === parseInt(levelNum));
                    if (level) {
                        setExpandedLevels(prev => new Set(prev).add(level.id));
                    }
                }
            }
        }
    }, [activePath, skills]);

    async function loadSkills() {
        try {
            setLoading(true);
            const data = await fetchSkills();
            setSkills(data.skills || []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load skills:', err);
        } finally {
            setLoading(false);
        }
    }

    function toggleSkill(skillId) {
        setExpandedSkills(prev => {
            const next = new Set(prev);
            if (next.has(skillId)) {
                next.delete(skillId);
            } else {
                next.add(skillId);
            }
            return next;
        });
    }

    function toggleLevel(levelId) {
        setExpandedLevels(prev => {
            const next = new Set(prev);
            if (next.has(levelId)) {
                next.delete(levelId);
            } else {
                next.add(levelId);
            }
            return next;
        });
    }

    return (
        <div className="fixed top-0 left-0 h-full w-[240px] bg-sidebar border-r border-border-subtle z-50 shadow-sm transition-transform duration-300 flex flex-col">
            {/* Sidebar Header / Logo */}
            <div className="h-[60px] flex items-center px-6 border-b border-border-subtle shrink-0">
                <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                        <span className="text-white font-bold text-sm">PC</span>
                    </div>
                    <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">PCDP Admin</h1>
                </div>
            </div>

            <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                <div className="px-3 py-2 mb-1">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Overview</p>
                </div>

                {STATIC_MENU.map(item => {
                    const Icon = item.icon;
                    const isActive = activePath === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 h-[44px] rounded-lg transition-all text-sm ${isActive
                                ? 'bg-accent-soft text-accent font-medium border-l-[3px] border-l-accent'
                                : 'text-text-muted border-l-[3px] border-l-transparent hover:bg-surface hover:text-text-primary'
                                }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}

                <div className="px-3 py-2 mt-4 mb-1">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Question Bank</p>
                </div>

                {loading && (
                    <div className="px-4 py-3 text-sm text-text-muted">Loading skills...</div>
                )}

                {error && (
                    <div className="px-4 py-3 text-sm text-danger">Failed to load skills: {error}</div>
                )}

                {!loading && !error && skills.length === 0 && (
                    <div className="px-4 py-3 text-sm text-text-muted">No skills available</div>
                )}

                {!loading && !error && skills.map(skill => (
                    <SkillSection
                        key={skill.id}
                        skill={skill}
                        isExpanded={expandedSkills.has(skill.id)}
                        onToggle={() => toggleSkill(skill.id)}
                        expandedLevels={expandedLevels}
                        onLevelToggle={toggleLevel}
                        activePath={activePath}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            {/* Pinned User Profile & Logout */}
            <div className="p-3 border-t border-border-subtle shrink-0">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 h-[44px] rounded-lg text-text-muted hover:bg-danger-soft hover:text-danger transition-all text-sm"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span className="font-medium">Logout</span>
                </button>
                <div className="flex items-center gap-3 mt-2 px-3 h-[44px]">
                    <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center border border-border-subtle shrink-0">
                        <span className="text-text-primary font-medium text-xs">
                            {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{user?.full_name || 'Admin User'}</p>
                        <p className="text-[11px] text-text-muted truncate">{user?.email || 'admin@pcdp.com'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
