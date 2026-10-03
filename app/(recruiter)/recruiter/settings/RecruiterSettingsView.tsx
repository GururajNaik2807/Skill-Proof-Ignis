"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function RecruiterSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfileId(user.id);
        setFullName(data.full_name || "");
        setCompanyName(data.company_name || "");
        setWebsite(data.website || "");
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    setSaving(true);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          website: website.trim(),
        })
        .eq("id", profileId);

      if (error) throw error;
      setNotice({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
        <Settings className="w-7 h-7 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-100">Recruiter Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your recruiter profile and company details.</p>
        </div>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
          notice.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notice.text}
          </div>
          <button onClick={() => setNotice(null)} className="hover:underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : (
        <form onSubmit={handleSave} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Company Website (Optional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                placeholder="https://acme.com"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
