"use client";

import { useState } from "react";
import { useFirmData } from "@/context/FirmContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Save, Clock, Calculator, X, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, FileText, Briefcase } from "lucide-react";

export default function StaffPage() {
    const { employees, addEmployee, taskLogs, addTaskLog, financials, clients, updateClient } = useFirmData();
    const [newEmployee, setNewEmployee] = useState({ name: "", role: "", hourlyCost: "", salary: "", dailyHours: "8", payType: "hourly" as "hourly" | "salary" });
    const [logEntry, setLogEntry] = useState({
        employeeId: "",
        description: "",
        hours: "",
        billingType: "flat_fee" as "billable" | "flat_fee",
        billableRate: "",
        caseId: "" // For flat fee - link to a case
    });
    const [showBreakdownModal, setShowBreakdownModal] = useState(false);
    const [lastLoggedData, setLastLoggedData] = useState<{
        employeeName: string;
        hours: number;
        laborCost: number;
        productionCost: number;
        overheadCost: number;
        description: string;
        billingType: "billable" | "flat_fee";
        billableValue: number;
        profitOrLoss: number;
        caseName?: string;
    } | null>(null);

    // Get selected employee for calculations
    const selectedEmployee = employees.find(e => e.id === logEntry.employeeId);

    // Calculate effective hourly cost (from hourly rate or derived from salary)
    const getEffectiveHourlyCost = (emp: typeof employees[0]) => {
        if (emp.hourlyCost > 0) return emp.hourlyCost;
        if (emp.salary && emp.salary > 0) {
            const weeklyHours = (emp.dailyHours || 8) * 5;
            return emp.salary / 52 / weeklyHours;
        }
        return 0;
    };

    // Get flat fee cases for dropdown
    const flatFeeCases = clients.filter(c => c.billingType === 'flat_fee' && c.status === 'active');
    const selectedCase = flatFeeCases.find(c => c.id === logEntry.caseId);

    // Algorithm: Calculate Labor Cost and Production Cost
    const hoursSpent = Number(logEntry.hours) || 0;
    const effectiveHourly = selectedEmployee ? getEffectiveHourlyCost(selectedEmployee) : 0;
    const laborCost = hoursSpent * effectiveHourly;
    const overheadCost = hoursSpent * financials.fixedOverheadHourly;
    const productionCost = laborCost + overheadCost;

    // AUTO-CALCULATE billable value for flat fee cases
    const getBillableValue = () => {
        if (logEntry.billingType === "billable") {
            const rate = Number(logEntry.billableRate) || 0;
            return hoursSpent * rate;
        } else if (selectedCase) {
            // FLAT FEE: Auto-calculate value portion
            // Formula: (Hours for this task / Total estimated hours) × Flat Fee
            const estimatedHours = selectedCase.estimatedHours || 1;
            const flatFeeAmount = selectedCase.flatFeeAmount || 0;
            return (hoursSpent / estimatedHours) * flatFeeAmount;
        }
        return 0;
    };
    const billableValue = getBillableValue();
    const profitOrLoss = billableValue - productionCost;

    const handleAddEmployee = () => {
        if (!newEmployee.name) {
            alert("Please enter a name.");
            return;
        }
        if (!newEmployee.hourlyCost && !newEmployee.salary) {
            alert("Please enter either an Hourly Cost or a Salary.");
            return;
        }
        addEmployee({
            id: Math.random().toString(36).substr(2, 9),
            name: newEmployee.name,
            role: newEmployee.role || "Staff",
            hourlyCost: Number(newEmployee.hourlyCost) || 0,
            salary: newEmployee.salary ? Number(newEmployee.salary) : undefined,
            dailyHours: Number(newEmployee.dailyHours) || 8,
            dailyTarget: (Number(newEmployee.hourlyCost) || (Number(newEmployee.salary) / 2080)) * 3
        });
        setNewEmployee({ name: "", role: "", hourlyCost: "", salary: "", dailyHours: "8", payType: "hourly" });
        alert("Employee added successfully to roster.");
    };

    const handleLogTask = () => {
        if (!logEntry.employeeId || !logEntry.description || !logEntry.hours) {
            alert("Please select an employee, describe the task, and enter hours spent.");
            return;
        }
        if (logEntry.billingType === "flat_fee" && !logEntry.caseId) {
            alert("Please select a case for flat fee work.");
            return;
        }

        // Update case hours logged
        if (logEntry.billingType === "flat_fee" && selectedCase) {
            const newHoursLogged = (selectedCase.hoursLogged || 0) + hoursSpent;
            updateClient(selectedCase.id, { hoursLogged: newHoursLogged });
        }

        // Save data for modal
        setLastLoggedData({
            employeeName: selectedEmployee?.name || "Unknown",
            hours: hoursSpent,
            laborCost: laborCost,
            productionCost: productionCost,
            overheadCost: overheadCost,
            description: logEntry.description,
            billingType: logEntry.billingType,
            billableValue: billableValue,
            profitOrLoss: profitOrLoss,
            caseName: selectedCase?.name
        });

        addTaskLog({
            id: Math.random().toString(36).substr(2, 9),
            employeeId: logEntry.employeeId,
            date: new Date().toISOString().split('T')[0],
            description: logEntry.description,
            hours: hoursSpent,
            laborCost: laborCost,
            productionCost: productionCost,
            status: "completed"
        });

        setLogEntry({ employeeId: "", description: "", hours: "", billingType: "flat_fee", billableRate: "", caseId: "" });
        setShowBreakdownModal(true);
    };

    return (
        <div className="min-h-screen p-8 md:p-12 space-y-8 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Staff & Productivity</h1>
                    <p className="text-white/70 mt-2">The Enforcer System: Auto Value Calculation</p>
                </div>
            </header>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* LEFT COLUMN: STAFF MANAGEMENT */}
                <div className="space-y-6">
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                        <CardHeader>
                            <CardTitle>Staff Roster</CardTitle>
                            <CardDescription>Active employees, daily hours, and labor cost tracking.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Daily Hrs</TableHead>
                                        <TableHead className="text-right">Rate/Salary</TableHead>
                                        <TableHead className="text-right">Total Labor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((emp) => {
                                        const empLogs = taskLogs.filter(log => log.employeeId === emp.id);
                                        const totalLaborCost = empLogs.reduce((acc, log) => acc + (log.laborCost || 0), 0);
                                        const effectiveRate = getEffectiveHourlyCost(emp);

                                        return (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">
                                                    <div>{emp.name}</div>
                                                    <div className="text-xs text-muted-foreground">{emp.role}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-primary font-medium">{emp.dailyHours || 8}h</span>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {emp.hourlyCost > 0 && <div>${emp.hourlyCost.toFixed(2)}/hr</div>}
                                                    {emp.salary && emp.salary > 0 && <div className="text-muted-foreground">${emp.salary.toLocaleString()}/yr</div>}
                                                    {emp.hourlyCost === 0 && emp.salary && <div className="text-muted-foreground">(≈${effectiveRate.toFixed(2)}/hr)</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-amber-500">
                                                    ${totalLaborCost.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {employees.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No staff recorded. Add personnel below.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="mt-6 p-4 border border-white/10 rounded-lg bg-muted/20 space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4" /> Add Personnel
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input placeholder="John Doe" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input placeholder="Associate" value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pay Type</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newEmployee.payType} onChange={(e) => setNewEmployee({ ...newEmployee, payType: e.target.value as "hourly" | "salary" })}>
                                            <option value="hourly">Hourly</option>
                                            <option value="salary">Salary</option>
                                        </select>
                                    </div>
                                    {newEmployee.payType === "hourly" ? (
                                        <div className="space-y-2">
                                            <Label>Hourly Cost ($)</Label>
                                            <Input type="number" step="0.01" placeholder="25.00" value={newEmployee.hourlyCost} onChange={(e) => setNewEmployee({ ...newEmployee, hourlyCost: e.target.value, salary: "" })} />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Annual Salary ($)</Label>
                                            <Input type="number" step="0.01" placeholder="52000.00" value={newEmployee.salary} onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value, hourlyCost: "" })} />
                                        </div>
                                    )}
                                    <div className="space-y-2 col-span-2">
                                        <Label className="flex items-center gap-2"><Clock className="w-3 h-3" /> Daily Work Hours</Label>
                                        <Input type="number" step="0.5" placeholder="8" value={newEmployee.dailyHours} onChange={(e) => setNewEmployee({ ...newEmployee, dailyHours: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <Button onClick={handleAddEmployee} className="w-full">Add to Roster</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: DAILY LOGGING */}
                <div className="space-y-6">
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                Daily Output Log
                            </CardTitle>
                            <CardDescription>
                                Log tasks. Value portion auto-calculated for flat fee cases.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={logEntry.employeeId} onChange={(e) => setLogEntry({ ...logEntry, employeeId: e.target.value })}>
                                    <option value="">Select Staff Member...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} (${getEffectiveHourlyCost(emp).toFixed(2)}/hr)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Task Description</Label>
                                <Input placeholder="e.g. Drafted Discovery Pleadings" value={logEntry.description} onChange={(e) => setLogEntry({ ...logEntry, description: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Clock className="w-3 h-3" /> Hours Spent</Label>
                                <Input type="number" step="0.25" placeholder="2.00" value={logEntry.hours} onChange={(e) => setLogEntry({ ...logEntry, hours: e.target.value })} />
                            </div>

                            {/* BILLING TYPE SELECTION */}
                            <div className="p-4 rounded-lg bg-secondary/30 border border-white/10 space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-bold">
                                    <DollarSign className="w-4 h-4" /> Billing Type
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" variant={logEntry.billingType === "billable" ? "default" : "outline"} className="w-full" onClick={() => setLogEntry({ ...logEntry, billingType: "billable", caseId: "" })}>
                                        <Clock className="w-4 h-4 mr-2" />
                                        Hourly Billing
                                    </Button>
                                    <Button type="button" variant={logEntry.billingType === "flat_fee" ? "default" : "outline"} className="w-full" onClick={() => setLogEntry({ ...logEntry, billingType: "flat_fee", billableRate: "" })}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Flat Fee Case
                                    </Button>
                                </div>

                                {logEntry.billingType === "billable" ? (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Billable Rate ($/hr)</Label>
                                        <Input type="number" step="0.01" placeholder="250.00" value={logEntry.billableRate} onChange={(e) => setLogEntry({ ...logEntry, billableRate: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> Select Case
                                        </Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={logEntry.caseId} onChange={(e) => setLogEntry({ ...logEntry, caseId: e.target.value })}>
                                            <option value="">Select a flat fee case...</option>
                                            {flatFeeCases.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} - ${(c.flatFeeAmount || 0).toLocaleString()} ({c.hoursLogged || 0}/{c.estimatedHours}h)
                                                </option>
                                            ))}
                                        </select>
                                        {flatFeeCases.length === 0 && (
                                            <p className="text-[10px] text-yellow-500">No flat fee cases found. Create one in Client Command first.</p>
                                        )}
                                        {selectedCase && (
                                            <div className="text-[10px] text-muted-foreground p-2 bg-background/50 rounded mt-2">
                                                <div className="font-semibold text-foreground">{selectedCase.name}</div>
                                                <div>Flat Fee: ${(selectedCase.flatFeeAmount || 0).toLocaleString()} • Est. Hours: {selectedCase.estimatedHours}</div>
                                                <div className="text-green-400 font-medium">Value/Hour: ${((selectedCase.flatFeeAmount || 0) / (selectedCase.estimatedHours || 1)).toFixed(2)}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* AUTO-CALCULATED COST BREAKDOWN PREVIEW */}
                            {selectedEmployee && hoursSpent > 0 && (logEntry.billingType === "billable" ? Number(logEntry.billableRate) > 0 : selectedCase) && (
                                <div className="p-4 rounded-lg bg-secondary/50 border border-white/10 space-y-3">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Calculator className="w-3 h-3" /> Auto-Calculated Results
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                                            <div className="text-xs text-amber-500">Production Cost</div>
                                            <div className="text-xl font-bold text-amber-500">${productionCost.toFixed(2)}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                                            <div className="text-xs text-blue-500">Value Portion</div>
                                            <div className="text-xl font-bold text-blue-500">${billableValue.toFixed(2)}</div>
                                            {logEntry.billingType === "flat_fee" && selectedCase && (
                                                <div className="text-[9px] text-muted-foreground">
                                                    {hoursSpent}h ÷ {selectedCase.estimatedHours}h × ${(selectedCase.flatFeeAmount || 0).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg text-center ${profitOrLoss >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                                        <div className={`text-xs ${profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {profitOrLoss >= 0 ? 'PROFIT' : 'LOSS'}
                                        </div>
                                        <div className={`text-2xl font-bold ${profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {profitOrLoss >= 0 ? '+' : ''}${profitOrLoss.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button onClick={handleLogTask} className="w-full" size="lg">Log Output</Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead className="text-right">Labor</TableHead>
                                        <TableHead className="text-right">Production</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {taskLogs.slice(-5).reverse().map(log => {
                                        const emp = employees.find(e => e.id === log.employeeId);
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{emp?.name || "Unknown"}</TableCell>
                                                <TableCell className="truncate max-w-[100px] text-xs">{log.description}</TableCell>
                                                <TableCell className="text-right text-amber-500 font-medium">${(log.laborCost || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-rose-500 font-medium">${(log.productionCost || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {taskLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-16">No activity logged.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* COST BREAKDOWN MODAL */}
            {showBreakdownModal && lastLoggedData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-primary/20 to-primary/10">
                            <div>
                                <h2 className="text-xl font-bold text-white">Cost Breakdown Analysis</h2>
                                <p className="text-sm text-white/70">Auto-calculated results</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowBreakdownModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 rounded-lg bg-muted/30 border">
                                <div className="text-sm font-medium text-muted-foreground">Task Logged</div>
                                <div className="font-semibold">{lastLoggedData.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {lastLoggedData.employeeName} • {lastLoggedData.hours} hours
                                    {lastLoggedData.caseName && <span> • Case: {lastLoggedData.caseName}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                                    <div className="text-xs text-amber-500 uppercase font-bold">Labor Cost</div>
                                    <div className="text-2xl font-bold text-amber-500 mt-1">${lastLoggedData.laborCost.toFixed(2)}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                                    <div className="text-xs text-blue-500 uppercase font-bold">Overhead</div>
                                    <div className="text-2xl font-bold text-blue-500 mt-1">${lastLoggedData.overheadCost.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                                    <div className="text-xs text-rose-500 uppercase font-bold">Total Cost</div>
                                    <div className="text-2xl font-bold text-rose-500 mt-1">${lastLoggedData.productionCost.toFixed(2)}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                                    <div className="text-xs text-cyan-500 uppercase font-bold">Value Earned</div>
                                    <div className="text-2xl font-bold text-cyan-500 mt-1">${lastLoggedData.billableValue.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg text-center ${lastLoggedData.profitOrLoss >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                                <div className={`text-xs uppercase font-bold ${lastLoggedData.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {lastLoggedData.profitOrLoss >= 0 ? '✅ PROFITABLE TASK' : '❌ MONEY-LOSING TASK'}
                                </div>
                                <div className={`text-3xl font-bold mt-1 ${lastLoggedData.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {lastLoggedData.profitOrLoss >= 0 ? '+' : ''}${lastLoggedData.profitOrLoss.toFixed(2)}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                {lastLoggedData.profitOrLoss >= 0 ? (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <div className="text-sm text-muted-foreground">
                                            This task generated more value than it cost. The firm made money.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <div className="text-sm text-muted-foreground">
                                            This task cost more than its value. Consider efficiency or case pricing.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-muted/20">
                            <Button onClick={() => setShowBreakdownModal(false)} className="w-full">Got It</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
