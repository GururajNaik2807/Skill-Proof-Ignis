import { Loader2 } from "lucide-react";

export default function RecruiterLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.05)]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
      
      <div className="space-y-3 flex flex-col items-center w-full max-w-sm">
        <div className="h-5 w-48 bg-white/10 rounded-md animate-pulse"></div>
        <div className="h-3 w-64 bg-white/5 rounded-md animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white/5 border border-white/10 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
