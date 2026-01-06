"use client";

import { useState } from "react";
import { useFirmData } from "@/context/FirmContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Book,
    LifeBuoy,
    Settings,
    Info,
    Map,
    Terminal,
    Shield,
    Wallet,
    Users,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Briefcase,
    Plus,
    Edit2,
    Save,
    X,
    Clock,
    Cloud,
    Database,
    UploadCloud
} from "lucide-react";
import { isConfigured, db } from "@/lib/firebase";
import { doc, writeBatch, collection } from "firebase/firestore";

const glossaryTerms = [
    {
        id: "lfos",
        title: "LFOS",
        shortDef: "Law Firm Survival & Recovery System",
        longDef: "The underlying operating system designed to stabilize financial operations. It prioritizes cash flow visibility and staff accountability over traditional case management features.",
        related: ["Radical Clarity", "Survival Protocol"]
    },
    {
        id: "burn",
        title: "Daily Burn",
        shortDef: "Fixed Cost of Operation per Day",
        longDef: "The calculated amount of money the firm loses every single day, regardless of revenue. It includes rent, salaries, software, and insurance. If you don't make this amount, you are losing money.",
        related: ["Runway", "Hourly Overhead"]
    },
    {
        id: "hourlyoperatingcost",
        title: "Hourly Operating Cost",
        shortDef: "Total Cost Per Hour to Run the Firm",
        longDef: "Calculated as (Total Staff Hourly Cost + Fixed Overhead Hourly). This represents every dollar spent per hour the firm operates. Formula: Sum of all employee hourly rates + (Monthly Fixed Expenses ÷ Total Monthly Staff Hours). If employees have different daily hours, the calculation uses actual hours, not a default 8-hour day.",
        related: ["Total Daily Burn", "Fixed Overhead"]
    },
    {
        id: "totaldailyburn",
        title: "Total Daily Burn",
        shortDef: "Complete Daily Operating Cost",
        longDef: "The sum of all hourly staff costs plus hourly fixed overhead, multiplied by the ACTUAL total daily staff hours (not a fixed 8-hour day). This number represents every dollar that leaves the firm each day the doors are open. If you have 3 employees working 8, 6, and 4 hours respectively, your total daily hours are 18, not 24.",
        related: ["Hourly Operating Cost", "Operating Cost Breakdown"]
    },
    {
        id: "runway",
        title: "Cash Runway",
        shortDef: "Days Until Insolvency",
        longDef: "A critical metric that divides your total 'Cash on Hand' by your 'Daily Burn'. It tells you exactly how many days the firm can survive without bringing in a single new dollar.",
        related: ["Daily Burn", "Cash on Hand"]
    },
    {
        id: "ratio",
        title: "Efficiency Ratio",
        shortDef: "Revenue Generated / Labor Cost",
        longDef: "The 'Enforcer' metric. It measures the ROI of an employee for a specific day. A ratio of 1.0 means they paid for themselves. Below 1.0 is a loss. Above 3.0 is high performance.",
        related: ["Labor Cost", "Production Value"]
    },
    {
        id: "roimultiplier",
        title: "ROI Multiplier",
        shortDef: "Return on Investment for Staff",
        longDef: "Calculated as (Total Revenue Generated / Total Labor Cost). An ROI Multiplier of 2.0x means the employee generated twice their cost in revenue. This is the key metric for determining if an employee is profitable.",
        related: ["Efficiency Ratio", "Daily Output Log"]
    },
    {
        id: "dailyoutputlog",
        title: "Daily Output Log",
        shortDef: "Mandatory Task Recording System",
        longDef: "The 'Enforcer' interface where every staff member must log their daily completed tasks, hours spent, and revenue generated. This data feeds directly into the ROI Multiplier and Efficiency Ratio calculations.",
        related: ["ROI Multiplier", "Staff Roster"]
    },
    {
        id: "operatingcost",
        title: "Operating Cost Breakdown",
        shortDef: "Hourly Cost Analysis",
        longDef: "A detailed breakdown showing Total Staff Cost (Hourly), Fixed Overhead (Hourly), and the combined Total Hourly Burn. This section also projects Daily, Weekly, and Yearly burn rates.",
        related: ["Total Daily Burn", "Fixed Overhead"]
    },
    {
        id: "survivalcalc",
        title: "Survival Calculator",
        shortDef: "Insolvency Countdown Timer",
        longDef: "Displays the number of days the firm can remain operational at current burn rate, assuming zero new revenue. This is your 'Days Remaining' metric. The lower this number, the more urgent action is required.",
        related: ["Cash Runway", "Daily Burn"]
    },
    {
        id: "cashboxmgmt",
        title: "Cashbox Management",
        shortDef: "Petty Cash Tracking System",
        longDef: "A dedicated ledger for tracking all physical cash and checks in the office. It records deposits (Cash, Checks) and withdrawals by category (Supplies, Stamps, CNB Bank, Bonus Pay, Borrow, Barter, Lunch/Snacks, Office Repairs). Each transaction includes date, sender/recipient, and description.",
        related: ["Cash In", "Withdrawal Categories"]
    },
    {
        id: "sitrep",
        title: "Situation Report (SitRep)",
        shortDef: "Weekly Performance Summary",
        longDef: "A professional, print-ready document summarizing the firm's weekly performance. It includes Executive Summary (Net Profit/Loss, Revenue, Expenses), Personnel Efficiency Audit (Staff ROI), Risk & Opportunities (At-Risk Clients), and Operational Notes.",
        related: ["Weekly Review", "ROI Multiplier"]
    },
    {
        id: "sponsor",
        title: "Sponsor",
        shortDef: "The Person Paying the Bill",
        longDef: "In the iTeam model, the Client (Inmate) is rarely the payer. The Sponsor is the family member or friend funding the defense. They must be tracked separately for billing purposes.",
        related: ["Client", "Retainer"]
    },
    {
        id: "retainer",
        title: "Retainer vs Flat Fee",
        shortDef: "Access vs Work Payment",
        longDef: "The Retainer covers the actual legal work. The Monthly Fee covers 'Access' to the firm. This split ensures consistent cash flow even when case work fluctuates.",
        related: ["Monthly Fee", "Sponsor"]
    },
    {
        id: "14day",
        title: "14-Day Rule",
        shortDef: "Mandatory Communication Cadence",
        longDef: "The firm rule that every active client must receive a meaningful update at least once every 14 days. Failure to do so triggers a 'Risk' alert.",
        related: ["Client Alerts", "Churn"]
    },
];

export default function SettingsPage() {
    const {
        addTicket,
        tickets,
        employees,
        clients,
        taskLogs,
        financials,
        cashboxTransactions,
        caseTypes,
        debugLogs,
        clearLogs
    } = useFirmData();
    const [activeTab, setActiveTab] = useState("overview");
    const [isMigrating, setIsMigrating] = useState(false);
    const [defaultTerm, setDefaultTerm] = useState(glossaryTerms[0]);
    const [ticketForm, setTicketForm] = useState({
        subject: "",
        description: "",
        submittedBy: "",
        priority: "medium" as "low" | "medium" | "high" | "urgent"
    });


    return (
        <div className="min-h-screen p-8 md:p-12 space-y-8 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900">
            <header className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
                    <p className="text-white/70 mt-2">Configuration & Support</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="md:col-span-1 space-y-2">
                    <Button
                        variant={activeTab === "overview" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("overview")}
                    >
                        <Info className="w-4 h-4 mr-2" /> Overview
                    </Button>
                    <Button
                        variant={activeTab === "ticket" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("ticket")}
                    >
                        <LifeBuoy className="w-4 h-4 mr-2" /> Support Ticket
                    </Button>
                    <Button
                        variant={activeTab === "manual" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("manual")}
                    >
                        <Book className="w-4 h-4 mr-2" /> Manual & Glossary
                    </Button>
                    <Button
                        variant={activeTab === "case-types" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("case-types")}
                    >
                        <Briefcase className="w-4 h-4 mr-2" /> Case Types
                    </Button>
                    <Button
                        variant={activeTab === "data" ? "default" : "ghost"}
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => setActiveTab("data")}
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Data Management
                    </Button>
                    <Button
                        variant={activeTab === "logs" ? "default" : "ghost"}
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setActiveTab("logs")}
                    >
                        <Terminal className="w-4 h-4 mr-2" /> System Logs (Debug)
                    </Button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-primary" />
                                        What is the LFOS?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                                    <p>
                                        The <strong>Law Firm Survival & Recovery System (LFOS)</strong> is a specialized operating system designed for law firms in crisis or growth modes. Unlike traditional practice management software, LFOS focuses entirely on <strong>financial bleeding, staff accountability, and cash flow stabilization</strong>.
                                    </p>
                                    <p>
                                        It operates on the principle of <strong>"Radical Clarity."</strong> You cannot fix what you cannot see. This system forces you to look at your true hourly costs, your staff's actual production value, and your runway to insolvency.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Map className="w-5 h-5 text-primary" />
                                        Advanced Navigation & Feature Usage
                                    </CardTitle>
                                    <CardDescription>
                                        Leverage the full power of the LFOS Intelligence Suite.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <Terminal className="w-4 h-4 text-primary" /> Command Center
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Real-time <strong>Daily Burn</strong> and <strong>Cash Runway</strong>. Monitor the health of the firm at a glance.
                                            </p>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <Users className="w-4 h-4 text-green-500" /> Staff & Output
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                "The Enforcer." Track <strong>Efficiency Ratios</strong> and <strong>ROI Multipliers</strong>. Log tasks to trigger cost algorithms.
                                            </p>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <Wallet className="w-4 h-4 text-blue-500" /> Strategic Finance
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Manage <strong>Aged Payables</strong>, <strong>Debts</strong>, and <strong>Operational Subscriptions</strong> (Clio, Wi-Fi).
                                            </p>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <Briefcase className="w-4 h-4 text-purple-500" /> Client Intake
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Manage <strong>Sponsors</strong> and <strong>Flat Fee Cases</strong>. Enforce the <strong>14-Day Communication Rule</strong>.
                                            </p>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <Shield className="w-4 h-4 text-cyan-500" /> Case Templates
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Standardize workflow with <strong>Custom Case Types</strong> and <strong>Auto-Hour Estimates</strong> for faster intake.
                                            </p>
                                        </div>

                                        <div className="p-4 border rounded-lg bg-card/50 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-2 text-sm">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" /> Cashbox Ledger
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Physical cash/check tracking. Audit <strong>Deposits</strong> and <strong>Withdrawal Categories</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Advanced Mastery: 26 Core Features
                                    </CardTitle>
                                    <CardDescription>Comprehensive guide to the LFOS feature set.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                                        <div className="space-y-3">
                                            <div><strong>1. Command Center:</strong> Central hub for survival metrics and emergency alerts.</div>
                                            <div><strong>2. Real-Time Daily Burn:</strong> Automatic calculation of operating costs per single day.</div>
                                            <div><strong>3. Cash Runway:</strong> Life-expectancy timer based on current cash vs. burn rate.</div>
                                            <div><strong>4. Staff Hour Customization:</strong> Set individual daily hours (not everyone works 8h).</div>
                                            <div><strong>5. Salary & Hourly Integration:</strong> Syncs monthly payroll with hourly cost data.</div>
                                            <div><strong>6. The Enforcer Log:</strong> Daily mandatory intake for all staff task production.</div>
                                            <div><strong>7. Efficiency Ratio:</strong> Mathematical score (Target 1.0x+) for personnel ROI.</div>
                                            <div><strong>8. ROI Multiplier:</strong> Live analysis of Revenue Generated vs. Labor Cost.</div>
                                            <div><strong>9. Production Cost Algorithm:</strong> Labor Cost + Pro-rated Overhead per task.</div>
                                            <div><strong>10. Strategic Billing Selection:</strong> Toggle between Hourly and Flat Fee cases.</div>
                                            <div><strong>11. Flat Fee Value Tracker:</strong> Auto-calculates task value based on case progress %.</div>
                                            <div><strong>12. Case Type Templates:</strong> Standardized legal services (Divorce, Parole, etc.).</div>
                                            <div><strong>13. Auto-Hour Estimates:</strong> Instant hour-loading during new client intake.</div>
                                        </div>
                                        <div className="space-y-3">
                                            <div><strong>14. Sponsor-Centric CRM:</strong> Tracks the 'Payer' separate from the 'Inmate'.</div>
                                            <div><strong>15. 14-Day Communication Rule:</strong> Automated flags for cases without updates.</div>
                                            <div><strong>16. Monthly Expense Audit:</strong> Detailed tracking of Rent, Wifi, Phone, and E-file.</div>
                                            <div><strong>17. Operational Subscriptions:</strong> Dedicated tracking for Clio and case software.</div>
                                            <div><strong>18. Dynamic Expense Engine:</strong> Add and delete custom firm expenses live.</div>
                                            <div><strong>19. Cashbox Ledger:</strong> Comprehensive petty-cash and physical check portal.</div>
                                            <div><strong>20. Financial Withdrawal Scats:</strong> Audit categories like Barter, Borrow, and CNB.</div>
                                            <div><strong>21. Weekly SitRep:</strong> Executive situation reports with profit/loss summaries.</div>
                                            <div><strong>22. AI Intelligence Suite:</strong> Built-in insights for firm growth and repair.</div>
                                            <div><strong>23. Radical Glossary:</strong> Interactive manual defining firm-specific concepts.</div>
                                            <div><strong>24. Multi-Layer Ticket System:</strong> Bug tracking with priority and submitter logs.</div>
                                            <div><strong>25. Data Reset Protocol:</strong> Secure method to clear legacy cache and data.</div>
                                            <div><strong>26. Dynamic Design System:</strong> High-performance UI with vibrant gradient themes.</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded bg-primary/10 border border-primary/20 text-[10px] text-muted-foreground leading-relaxed italic">
                                        Pro Tip: Speed up your workflow by using the sidebar navigation. The system is designed for high-speed client-side transitions to minimize downtime.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "ticket" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <LifeBuoy className="w-5 h-5 text-primary" />
                                    Submit a Support Ticket
                                </CardTitle>
                                <CardDescription>
                                    Report a bug or request a repair. Tickets appear on the Command Center dashboard.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!ticketForm.subject || !ticketForm.description || !ticketForm.submittedBy) {
                                        alert("Please fill in all fields including your name.");
                                        return;
                                    }
                                    addTicket({
                                        subject: ticketForm.subject,
                                        description: ticketForm.description,
                                        submittedBy: ticketForm.submittedBy,
                                        priority: ticketForm.priority
                                    });
                                    // Calculate next number for the alert (matching context logic)
                                    const ticketNums = tickets.map(t => parseInt(t.ticketNumber, 10));
                                    const highestNum = ticketNums.length > 0 ? Math.max(...ticketNums) : 0;
                                    const ticketNum = (highestNum + 1).toString().padStart(5, '0');

                                    alert(`Ticket #${ticketNum} submitted successfully! View it on the Command Center.`);
                                    setTicketForm({ subject: "", description: "", submittedBy: "", priority: "medium" });
                                }}>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Issue Subject</label>
                                            <input
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                required
                                                placeholder="Brief description of issue"
                                                value={ticketForm.subject}
                                                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Your Name</label>
                                            <input
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                required
                                                placeholder="Who is reporting this?"
                                                value={ticketForm.submittedBy}
                                                onChange={(e) => setTicketForm({ ...ticketForm, submittedBy: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Priority Level</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                value={ticketForm.priority}
                                                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as "low" | "medium" | "high" | "urgent" })}
                                            >
                                                <option value="low">Low - Cosmetic/Minor</option>
                                                <option value="medium">Medium - Functionality Impaired</option>
                                                <option value="high">High - System Broken</option>
                                                <option value="urgent">Urgent - Cannot Work</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground text-xs text-muted-foreground italic pt-6">
                                                Ticket numbering: #00001 start
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Problem Description</label>
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            placeholder="Please describe what happened in detail..."
                                            required
                                            value={ticketForm.description}
                                            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" className="w-full md:w-auto">
                                            Submit Ticket
                                        </Button>
                                    </div>
                                </form>

                                {/* Recent Tickets */}
                                {tickets.length > 0 && (
                                    <div className="mt-8 border-t pt-6">
                                        <h4 className="text-sm font-semibold mb-4 text-foreground">Recent Audit Tickets</h4>
                                        <div className="space-y-3">
                                            {tickets.slice(0, 5).map((ticket) => (
                                                <div key={ticket.id} className={`p-4 rounded-lg border ${ticket.status === 'resolved' ? 'bg-green-500/5 border-green-500/20' : 'bg-card/50 border-white/10'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-mono font-bold text-primary">TICKET #{ticket.ticketNumber}</div>
                                                            <div className="font-semibold text-sm text-foreground">{ticket.subject}</div>
                                                        </div>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm ${ticket.status === 'resolved' ? 'bg-green-500 text-white' :
                                                            ticket.priority === 'urgent' ? 'bg-red-500 text-white animate-pulse' :
                                                                ticket.priority === 'high' ? 'bg-orange-500 text-white' :
                                                                    'bg-primary text-white'
                                                            }`}>
                                                            {ticket.status === 'resolved' ? 'Resolved' : ticket.priority}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-white/5 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-3 h-3" />
                                                            {ticket.submittedBy}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    {ticket.resolution && (
                                                        <div className="mt-2 text-xs text-green-500 bg-green-500/10 p-2 rounded flex items-start gap-2">
                                                            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                                                            <div>
                                                                <span className="font-bold">Resolution:</span> {ticket.resolution}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "case-types" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                        Case Type Templates
                                    </CardTitle>
                                    <CardDescription>
                                        Configure default estimated hours for different case categories. These will auto-populate when creating a new client file.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CaseTypeManagement />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "manual" && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="md:col-span-1 h-[500px] flex flex-col">
                                <CardHeader className="pb-3 border-b">
                                    <div className="relative">
                                        <Book className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            placeholder="Search terms..."
                                            className="w-full pl-9 h-9 rounded-md border border-input bg-background text-sm"
                                        />
                                    </div>
                                </CardHeader>
                                <div className="flex-1 overflow-y-auto p-2">
                                    <div className="space-y-1">
                                        {glossaryTerms.map((term) => (
                                            <button
                                                key={term.id}
                                                onClick={() => setDefaultTerm(term)}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${defaultTerm.id === term.id
                                                    ? "bg-accent text-accent-foreground font-medium"
                                                    : "hover:bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {term.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card className="md:col-span-2 h-[500px] flex flex-col">
                                <CardHeader className="border-b bg-muted/20">
                                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">
                                        {defaultTerm.title}
                                    </CardTitle>
                                    <CardDescription className="text-base font-medium text-foreground/80 pt-1">
                                        {defaultTerm.shortDef}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 overflow-y-auto leading-relaxed text-muted-foreground space-y-4">
                                    <p>{defaultTerm.longDef}</p>

                                    {defaultTerm.related && (
                                        <div className="pt-4 mt-4 border-t">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">See Also</span>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {defaultTerm.related.map(r => (
                                                    <span key={r} className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "data" && (
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Data Management & Cloud
                                </CardTitle>
                                <CardDescription>
                                    Manage your data storage, clear local cache, or sync to your global cloud backend.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/5 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                                                <Cloud className="w-4 h-4" /> Cloud Backend Support
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Status: {isConfigured ? (
                                                    <span className="text-green-500 font-bold">CONNECTED</span>
                                                ) : (
                                                    <span className="text-orange-500 font-bold italic">DISCONNECTED (Waiting for Keys)</span>
                                                )}
                                            </p>
                                        </div>
                                        {isConfigured && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isMigrating}
                                                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                                onClick={async () => {
                                                    if (!confirm("This will upload all your local browser data to the Firebase cloud. Continue?")) return;
                                                    setIsMigrating(true);
                                                    try {
                                                        const batch = writeBatch(db);

                                                        employees.forEach(emp => {
                                                            batch.set(doc(db, "employees", emp.id), emp);
                                                        });

                                                        clients.forEach(client => {
                                                            batch.set(doc(db, "clients", client.id), client);
                                                        });

                                                        batch.set(doc(db, "settings", "financials"), financials);

                                                        tickets.forEach(t => {
                                                            batch.set(doc(db, "tickets", t.id), t);
                                                        });

                                                        caseTypes.forEach(ct => {
                                                            batch.set(doc(db, "caseTypes", ct.id), ct);
                                                        });

                                                        await batch.commit();
                                                        alert("Migration Complete! Your data is now synced to the cloud.");
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Migration failed. Check console for details.");
                                                    } finally {
                                                        setIsMigrating(false);
                                                    }
                                                }}
                                            >
                                                <UploadCloud className={`w-4 h-4 mr-2 ${isMigrating ? 'animate-bounce' : ''}`} />
                                                {isMigrating ? "Syncing..." : "Migrate Local to Cloud"}
                                            </Button>
                                        )}
                                    </div>
                                    {!isConfigured && (
                                        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded border border-white/5">
                                            <p className="font-bold flex items-center gap-1 mb-1 text-foreground">
                                                <Terminal className="w-3 h-3" /> Project Setup Required
                                            </p>
                                            Instructions added to <code>src/lib/firebase-config.ts</code>. Paste your API keys there to activate cloud syncing and multi-device support.
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                                    <h4 className="font-semibold text-destructive mb-2">⚠️ Dangerous Actions</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Clearing all data will remove all employees, clients, and financials stored in your current browser.
                                    </p>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => {
                                            if (confirm("Are you absolutely sure? This will delete ALL data locally. This cannot be undone.")) {
                                                localStorage.removeItem("law-firm-os-data");
                                                alert("All data has been cleared. The page will now reload.");
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear Local Data & Start Fresh
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <p><strong>What gets deleted:</strong></p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>All employees in Staff Roster</li>
                                        <li>All task logs and activity history</li>
                                        <li>All financial data and expense settings</li>
                                        <li>All cashbox transactions</li>
                                        <li>All client records</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "logs" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-primary" />
                                    System Debug Logs
                                </CardTitle>
                                <CardDescription>
                                    Live activity log for troubleshooting Firestore synchronization issues.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={clearLogs}>Clear Logs</Button>
                                </div>
                                <div className="bg-black/80 text-green-400 font-mono text-xs p-4 rounded h-[400px] overflow-y-auto">
                                    {debugLogs.length === 0 ? (
                                        <div className="opacity-50">No activity logged yet...</div>
                                    ) : (
                                        debugLogs.map((log, i) => (
                                            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function CaseTypeManagement() {
    const { caseTypes, addCaseType, updateCaseType, deleteCaseType } = useFirmData();
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState({ name: "", estimatedHours: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", estimatedHours: "" });

    const handleAdd = () => {
        if (!newType.name || !newType.estimatedHours) return;
        addCaseType({
            name: newType.name,
            estimatedHours: Number(newType.estimatedHours)
        });
        setNewType({ name: "", estimatedHours: "" });
        setIsAdding(false);
    };

    const startEdit = (ct: any) => {
        setEditingId(ct.id);
        setEditForm({ name: ct.name, estimatedHours: String(ct.estimatedHours) });
    };

    const handleUpdate = () => {
        if (!editingId || !editForm.name || !editForm.estimatedHours) return;
        updateCaseType(editingId, {
            name: editForm.name,
            estimatedHours: Number(editForm.estimatedHours)
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Active Templates
                </h3>
                {!isAdding && (
                    <Button size="sm" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" /> New Template
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                placeholder="e.g. Divorce Proceeding"
                                value={newType.name}
                                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estimated Hours</Label>
                            <Input
                                type="number"
                                placeholder="40"
                                value={newType.estimatedHours}
                                onChange={(e) => setNewType({ ...newType, estimatedHours: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAdd}>Save Template</Button>
                    </div>
                </div>
            )}

            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                {caseTypes.map((ct) => (
                    <div key={ct.id} className="p-3 border rounded-lg flex items-center justify-between bg-card/50 hover:bg-card transition-colors">
                        {editingId === ct.id ? (
                            <div className="flex-1 grid grid-cols-2 gap-2 mr-4">
                                <Input
                                    className="h-8 border-primary/30 focus:border-primary"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                                <Input
                                    className="h-8 border-primary/30 focus:border-primary"
                                    type="number"
                                    value={editForm.estimatedHours}
                                    onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded bg-primary/10 text-primary">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-foreground">{ct.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {ct.estimatedHours} hours default
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-1">
                            {editingId === ct.id ? (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={handleUpdate}>
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(ct)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteCaseType(ct.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-lg bg-primary/5 text-xs text-muted-foreground border border-primary/10">
                <span className="font-bold text-primary">Radical Clarity Tip:</span> These templates set the starting point for a case. You can still adjust the hours manually for specific clients during intake in the <strong className="text-foreground">Client Command</strong> section.
            </div>
        </div>
    );
}

