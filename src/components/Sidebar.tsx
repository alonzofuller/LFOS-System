"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, BadgeDollarSign, ShieldAlert, FileText, Sparkles, Settings, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useFirmData } from "@/context/FirmContext";
import { Button } from "./ui/button";

const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/staff", label: "Staff & Output", icon: Users },
    { href: "/finance", label: "Financials", icon: BadgeDollarSign },
    { href: "/clients", label: "Client Intake", icon: ShieldAlert },
    { href: "/report", label: "Weekly SitRep", icon: FileText },
    { href: "/intel", label: "Firm Intelligence", icon: Sparkles },
    { href: "/settings", label: "Settings & Help", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCloudSyncActive, firebaseProjectId, refreshEmployees } = useFirmData();

    return (
        <div className="flex flex-col w-64 border-r bg-card/30 min-h-screen p-4 space-y-4">
            <div className="px-4 py-2 mb-4">
                <h2 className="text-xl font-bold tracking-tighter">LFOS</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Recovery System</p>
            </div>
            <nav className="space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-4 py-4 border-t space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Online
                </div>

                <div className={cn(
                    "flex flex-col gap-1 p-2 rounded border",
                    isCloudSyncActive
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                )}>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                        {isCloudSyncActive ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                        {isCloudSyncActive ? "Cloud Sync Active" : "Local Only Mode"}
                    </div>
                    {isCloudSyncActive && firebaseProjectId && (
                        <div className="text-[8px] opacity-50 truncate font-mono">
                            PID: {firebaseProjectId}
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 gap-2"
                    onClick={async () => {
                        if (refreshEmployees) {
                            await refreshEmployees();
                            alert("Staff roster refreshed from Firestore.");
                        }
                    }}
                >
                    <RefreshCw className="w-3 h-3" />
                    Refresh Staff Roster
                </Button>
            </div>
        </div>
    );
}
