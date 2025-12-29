"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, BadgeDollarSign, ShieldAlert, BarChart3, FileText, Sparkles, Settings } from "lucide-react";

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

            <div className="mt-auto px-4 py-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Online
                </div>
            </div>
        </div>
    );
}
