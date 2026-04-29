"use client";

import { useEffect, useState } from "react";
import { HardDrive, AlertCircle, RefreshCw } from "lucide-react";

interface StorageData {
  used: number;
  limit: number;
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

export default function StorageUsage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StorageData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUsage();
  }, []);

  const fetchUsage = () => {
    setLoading(true);
    setError(false);
    fetch("/api/cloudinary-usage")
      .then((res) => {
        if (!res.ok) throw new Error("Non-OK response");
        return res.json();
      })
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json as StorageData);
        setLastUpdated(new Date());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // 1. Fix Hydration Mismatch: Show a consistent skeleton on first render (Server & Client)
  if (!mounted) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Client-only logic starts here
  const used = data?.used ?? 0;
  const limit = data?.limit ?? 1;
  const usedMB = formatMB(used);
  const totalMB = formatMB(limit);
  const remainingMB = formatMB(Math.max(limit - used, 0));
  const percent = parseFloat(((used / limit) * 100).toFixed(1));
  const percentStr = isNaN(percent) ? "0.0" : percent.toFixed(1);

  const barColor =
    percent >= 90 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-purple-600";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50">
            <HardDrive className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Storage Usage</h2>
            {lastUpdated && !loading && (
              <p className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh storage"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-400 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-red-500 text-sm py-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Could not load storage data. Check API credentials.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>
          {/* Label */}
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold text-gray-900">{usedMB} MB</span>
            {" "}used of{" "}
            <span className="font-semibold text-gray-900">{totalMB} MB</span>
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>

          {/* Used / Remaining row */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Used: {usedMB} MB</span>
            <span>Remaining: {remainingMB} MB</span>
          </div>

          {/* Percent */}
          <p className="text-xs text-gray-400">{percentStr}% used</p>

          {/* Warning banner > 90% */}
          {percent > 90 && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Storage almost full. Consider cleanup or upgrading your plan.
            </div>
          )}

          {/* Warning banner > 80% */}
          {percent > 80 && percent <= 90 && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Storage is running low (&gt;80%). Consider cleaning up assets.
            </div>
          )}
        </>
      )}
    </div>
  );
}
