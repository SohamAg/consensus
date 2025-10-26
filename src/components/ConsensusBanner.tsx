'use client';

interface ConsensusBannerProps {
  roomId: string;
  channel: any;
}

export function ConsensusBanner({ roomId, channel }: ConsensusBannerProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-slate-800">Consensus</span>
        <span className="text-xs text-emerald-600 font-medium">Online</span>
      </div>
    </div>
  );
}

