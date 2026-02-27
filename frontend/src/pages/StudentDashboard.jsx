import { ArrowRight, Clock, FileText, Code, GraduationCap, User, Hash, LogOut } from 'lucide-react';

const LEVEL_DESCRIPTIONS = {
  '1': 'Basic JavaScript Logic',
  '2': 'Intermediate JavaScript Logic',
  '3': 'React Native UI Development',
  '4': 'Advanced React Native Development',
};

function getLevelDescription(level) {
  if (!level) return 'React Native UI Development';
  const num = level.charAt(0);
  return LEVEL_DESCRIPTIONS[num] || 'React Native Development';
}

export default function StudentDashboard({ user, level, durationMinutes, questionCount, onPlayground, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
                <Code className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-lg tracking-tight block leading-none">MobileDev</span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Student Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-700">{user?.full_name || "Student"}</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Section */}
        <div className="mb-10 animate-in slide-in-from-top">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Ready to take your next assessment? Check your current level and start a new session below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Info Card - Level */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Current Level</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{level || '3A'}</h3>
              <p className="text-xs text-slate-400 mt-2">{getLevelDescription(level)}</p>
            </div>
          </div>

          {/* Info Card - Identity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Identity</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded-md">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Enrollment No.</p>
                      <p className="text-sm font-semibold text-slate-700">{user?.enrollment_no || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded-md">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Roll No.</p>
                      <p className="text-sm font-semibold text-slate-700">{user?.roll_no || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card - Start Assessment */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-200">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Next Session</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Start Assessment</h3>
              <p className="text-slate-300 text-sm mb-6">
                {questionCount} Question{questionCount !== 1 ? 's' : ''} • {durationMinutes} Minutes
              </p>

              <button
                onClick={onPlayground}
                className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 group-hover:scale-[1.02] duration-200"
              >
                <span>Launch Environment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity / Instructions (Placeholder for future) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Instructions</h3>
          <div className="prose prose-slate prose-sm max-w-none text-slate-500">
            <ul className="space-y-2">
              <li>Ensure you have a stable internet connection before starting.</li>
              <li>Do not refresh the page during the assessment as it may reset your session environment.</li>
              <li>Submissions are auto-saved, but manually submit your code before the timer runs out.</li>
              <li>For UI problems, your output is verified visually by the admin.</li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
}
