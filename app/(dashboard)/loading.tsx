import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.05)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF]" />
      </div>
      
      <div className="space-y-3 flex flex-col items-center w-full max-w-sm">
        <div className="h-5 w-40 bg-white/10 rounded-md animate-pulse"></div>
        <div className="h-3 w-64 bg-white/5 rounded-md animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
