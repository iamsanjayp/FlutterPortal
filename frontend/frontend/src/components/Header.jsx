export default function Header() {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
      
      {/* Left */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Flutter Skill Test
        </h1>
        <p className="text-sm text-slate-500">
          Level 1A – Coding Assessment
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6 text-sm">
        <span className="font-mono text-blue-600">
          ⏱ Time Left: 01:30:00
        </span>
        <span className="text-slate-600 font-medium">
          SANJAY P
        </span>
      </div>
    </div>
  );
}
