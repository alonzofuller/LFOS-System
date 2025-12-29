"use client";

import { useFirmData } from "@/context/FirmContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingDown, DollarSign, Users, Clock, TicketCheck, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SupportTicket } from "@/types";

export default function Home() {
  const { employees, financials, clients, tickets, resolveTicket } = useFirmData();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolution, setResolution] = useState("");

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculations
  const totalDailyStaffHours = employees.reduce((acc, emp) => acc + (emp.dailyHours || 8), 0);
  const totalHourlyStaffCost = employees.reduce((acc, emp) => acc + emp.hourlyCost, 0);
  const totalHourlyOverhead = financials.fixedOverheadHourly;
  const totalHourlyBurn = totalHourlyStaffCost + totalHourlyOverhead;
  const dailyBurn = totalHourlyBurn * (totalDailyStaffHours || 8);

  const atRiskClients = clients.filter(c => c.status === 'risk' || c.status === 'churned').length;
  const activeClients = clients.filter(c => c.status === 'active').length;

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');

  const handleResolve = () => {
    if (!selectedTicket || !resolution.trim()) {
      alert("Please enter a resolution.");
      return;
    }
    resolveTicket(selectedTicket.id, resolution);
    setSelectedTicket(null);
    setResolution("");
  };

  return (
    <main className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* TICKET NOTIFICATION BAR */}
      {openTickets.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
              <TicketCheck className="w-4 h-4" />
              OPEN SUPPORT TICKETS ({openTickets.length})
            </h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/settings')}>
              View All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {openTickets.slice(0, 5).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "px-3 py-2 rounded-lg text-left text-sm transition-all hover:scale-105 cursor-pointer border",
                  ticket.priority === 'urgent' ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30' :
                    ticket.priority === 'high' ? 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30' :
                      ticket.priority === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30' :
                        'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30'
                )}
              >
                <div className="text-xs font-mono text-muted-foreground">#{ticket.ticketNumber}</div>
                <div className="font-medium truncate max-w-[200px]">{ticket.subject}</div>
                <div className={cn(
                  "text-[10px] uppercase font-bold mt-1",
                  ticket.priority === 'urgent' ? 'text-red-500' :
                    ticket.priority === 'high' ? 'text-orange-500' :
                      ticket.priority === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                )}>
                  {ticket.priority}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Firm Command Center</h1>
          <p className="text-white/70 mt-2">Survival Protocol: Active</p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-3xl font-mono font-bold tracking-widest text-primary flex items-center justify-end gap-3">
            <Clock className="w-6 h-6" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {/* Metric 1: Hourly Bleed */}
        <Card className="border-l-4 border-l-destructive bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hourly Operating Cost
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${totalHourlyBurn.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${dailyBurn.toLocaleString()} per day ({totalDailyStaffHours || 8}h)
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Cash Runway */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash on Hand
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financials.cashOnHand.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financials.cashOnHand > 0 && dailyBurn > 0 ? (
                financials.cashOnHand / dailyBurn < 30
                  ? <span className="text-red-500 font-medium">{Math.floor(financials.cashOnHand / dailyBurn)} Days Runway</span>
                  : <span>{Math.floor(financials.cashOnHand / dailyBurn)} Days Runway</span>
              ) : dailyBurn === 0 ? "No burn calculated" : "INSOLVENT"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Staff Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Staff
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Billing Target: ${employees.reduce((acc, emp) => acc + emp.dailyTarget, 0).toLocaleString()}/day
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Client Alerts */}
        <Card className={cn(atRiskClients > 0 && "border-yellow-600 bg-yellow-950/20")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Client Alerts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeClients} Active / {atRiskClients + activeClients} Total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 transition-all hover:bg-muted/10">
          <CardHeader>
            <CardTitle>Financial Reality</CardTitle>
            <CardDescription>Estimated operational costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4 border-dashed">
                <span className="font-medium">Staff Payroll (Hourly)</span>
                <span>${totalHourlyStaffCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-4 border-dashed">
                <span className="font-medium">Fixed Overhead (Hourly)</span>
                <span>${totalHourlyOverhead.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-lg">Total Daily Burn</span>
                <span className="font-bold text-lg text-rose-500">${dailyBurn.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Based on {totalDailyStaffHours || 8} total staff hours per day</p>
              <div className="bg-destructive/10 p-4 rounded-lg mt-6 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  <span className="font-bold">BLEEDING ALERT:</span> You must generate <span className="underline">${dailyBurn.toLocaleString()}</span> today or you will lose money.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => router.push('/clients')}
              className="w-full bg-primary text-primary-foreground h-10 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Log New Client Intake
            </button>
            <button
              onClick={() => router.push('/staff')}
              className="w-full bg-secondary text-secondary-foreground h-10 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Review Staff Daily Logs
            </button>
            <button
              onClick={() => router.push('/finance')}
              className="w-full border border-input bg-background h-10 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Update Financials
            </button>
          </CardContent>
        </Card>
      </div>

      {/* TICKET RESOLUTION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-amber-500/20 to-orange-500/10">
              <div>
                <div className="text-xs font-mono text-muted-foreground">Ticket #{selectedTicket.ticketNumber}</div>
                <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedTicket(null); setResolution(""); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Priority</div>
                  <div className={cn(
                    "font-bold uppercase",
                    selectedTicket.priority === 'urgent' ? 'text-red-500' :
                      selectedTicket.priority === 'high' ? 'text-orange-500' :
                        selectedTicket.priority === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                  )}>
                    {selectedTicket.priority}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Status</div>
                  <div className="font-bold uppercase">{selectedTicket.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Created</div>
                  <div>{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Time</div>
                  <div>{new Date(selectedTicket.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="text-xs text-muted-foreground uppercase mb-2">Description</div>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              {/* Resolution Form */}
              {selectedTicket.status !== 'resolved' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold">Resolution Notes</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Describe how this issue was resolved..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </div>
              )}

              {selectedTicket.status === 'resolved' && selectedTicket.resolution && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-500 font-bold text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    RESOLVED
                  </div>
                  <p className="text-sm">{selectedTicket.resolution}</p>
                  {selectedTicket.resolvedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolved on {new Date(selectedTicket.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/20 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setSelectedTicket(null); setResolution(""); }}>
                Close
              </Button>
              {selectedTicket.status !== 'resolved' && (
                <Button className="flex-1" onClick={handleResolve}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
