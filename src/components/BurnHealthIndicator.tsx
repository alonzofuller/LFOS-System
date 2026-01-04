"use client";

import { useFirmData } from "@/context/FirmContext";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function BurnHealthIndicator() {
    const { dailyBurnMetrics } = useFirmData();
    const { total_daily_burn, daily_payroll, daily_fixed_overhead, total_daily_hours, hourly_burn_rate } = dailyBurnMetrics;

    // Sanity Check: If total_daily_burn > (daily_payroll * 2.5), flag potential overhead duplication
    const overheadDuplicationRisk = total_daily_burn > (daily_payroll * 2.5) && daily_payroll > 0;

    // Calculate health ratio (payroll vs total burn)
    // Ideally payroll should be a significant portion of the burn, not just overhead.
    const healthRatio = daily_payroll > 0 ? (daily_payroll / total_daily_burn) * 100 : 0;

    return (
        <div className="space-y-4 p-4 rounded-xl border bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-tight uppercase text-muted-foreground flex items-center gap-2">
                    PayTrack: Burn Health
                    {overheadDuplicationRisk ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                </h3>
                <span className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded border",
                    overheadDuplicationRisk ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-green-500/10 border-green-500/30 text-green-500"
                )}>
                    {overheadDuplicationRisk ? "RISK: HIGH OVERHEAD" : "HEALTHY"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Daily Burn</div>
                    <div className="text-xl font-mono font-bold text-white">${total_daily_burn.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Hourly Burn Rate</div>
                    <div className="text-xl font-mono font-bold text-primary">
                        {hourly_burn_rate ? `$${hourly_burn_rate.toFixed(2)}/h` : "N/A"}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span>Labor (${daily_payroll.toFixed(0)})</span>
                    <span>Fixed (${daily_fixed_overhead.toFixed(0)})</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${healthRatio}%` }}
                    />
                    <div
                        className="h-full bg-amber-500/50 transition-all duration-500"
                        style={{ width: `${100 - healthRatio}%` }}
                    />
                </div>
            </div>

            {overheadDuplicationRisk && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-[10px] text-amber-200 flex gap-2">
                    <Info className="w-3 h-3 shrink-0" />
                    <p>WARNING: Total daily burn exceeds 2.5x payroll. Check for duplicated fixed overhead or high non-labor costs.</p>
                </div>
            )}

            {!hourly_burn_rate && total_daily_hours === 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-2 rounded text-[10px] text-blue-200 flex gap-2">
                    <Info className="w-3 h-3 shrink-0" />
                    <p>Total daily hours are 0. Hourly burn rate is currently null for pricing accuracy.</p>
                </div>
            )}
        </div>
    );
}
