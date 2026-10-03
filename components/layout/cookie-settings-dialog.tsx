"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, ShieldCheck, BarChart3, Sliders, Megaphone, Check } from "lucide-react";
import Link from "next/link";

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  updatedAt: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  functional: true,
  marketing: false,
  updatedAt: "",
};

const STORAGE_KEY = "cpace_cookie_preferences";

interface CookieSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettingsDialog({
  open,
  onOpenChange,
}: CookieSettingsDialogProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch {
      // localStorage may not be available in private mode or SSR
    }
  }, [open]);

  const handleSave = (updated: CookiePreferences) => {
    try {
      const payload = { ...updated, necessary: true, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setPreferences(payload);
      window.dispatchEvent(new CustomEvent("cpace:cookie_preferences_updated", { detail: payload }));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onOpenChange(false);
      }, 600);
    } catch {
      onOpenChange(false);
    }
  };

  const handleAcceptAll = () => {
    handleSave({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    handleSave({
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-gray-950 text-white border-white/10 shadow-2xl p-6">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Cookie className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              Cookie Preferences & Settings
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            CPACE Philippines uses cookies and related technologies to ensure portal security,
            support proctored examinations, analyze learning traffic, and deliver personalized
            continuing professional education services in accordance with the Philippine Data Privacy
            Act of 2012 (RA 10173).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3">
          {/* Strictly Necessary */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-sm text-white">
                  Strictly Necessary Cookies
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Always Active
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Essential for core portal features, authenticated learner sessions, credential verification,
              and security protections. These cannot be disabled.
            </p>
          </div>

          {/* Performance & Analytics */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="font-semibold text-sm text-white">
                  Performance & Analytics
                </span>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Help us measure anonymous traffic, identify popular course modules, and enhance
              portal responsiveness.
            </p>
          </div>

          {/* Functional Cookies */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-sm text-white">
                  Functional & Preferences
                </span>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, functional: checked }))
                }
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Remember your preferences such as proctor feed views, audio-video calibration,
              and filter choices across testing sessions.
            </p>
          </div>

          {/* Marketing & Announcements */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-sm text-white">
                  Announcements & Social Sharing
                </span>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Allow social sharing and customized updates on upcoming certification cohorts,
              masterclasses, and partner events.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1 items-center pt-1">
          <span>Read our full policies:</span>
          <Link
            href="/privacy"
            onClick={() => onOpenChange(false)}
            className="text-emerald-400 hover:underline"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            href="/cookies"
            onClick={() => onOpenChange(false)}
            className="text-emerald-400 hover:underline"
          >
            Cookie Policy
          </Link>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={handleRejectNonEssential}
            className="border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white text-xs h-9"
          >
            Reject Non-Essential
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(preferences)}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-9"
          >
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            ) : (
              "Save Preferences"
            )}
          </Button>
          <Button
            type="button"
            onClick={handleAcceptAll}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9"
          >
            Accept All Cookies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
