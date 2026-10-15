"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  fullName: string;
}

export default function AdminSettingsClient({ email, fullName }: Props) {
  const [username, setUsername] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleUsernameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: username }).eq("id", user.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");

    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwSaving(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setPwError("Current password is incorrect.");
      setPwSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setPwError(updateError.message);
      setPwSaving(false);
      return;
    }

    setPwSaving(false);
    setPwSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account settings</p>
      </div>

      <form onSubmit={handleUsernameSave} className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Account Information</h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
          <input type="email" value={email} disabled
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 transition-colors" />
        </div>
        <button type="submit" disabled={saving}
          className="py-2.5 px-6 bg-[#4682B4] text-white font-medium rounded-lg text-sm hover:bg-[#3A6E9A] transition-colors disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Change Password</h2>
        {pwError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-lg">{pwError}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 transition-colors" />
        </div>
        <button type="submit" disabled={pwSaving}
          className="py-2.5 px-6 bg-[#8B4513] text-white font-medium rounded-lg text-sm hover:bg-[#A0522D] transition-colors disabled:opacity-50">
          {pwSaving ? "Updating..." : pwSaved ? "Password Updated!" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
