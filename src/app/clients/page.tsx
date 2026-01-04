"use client";

import { useFirmData } from "@/context/FirmContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PlusCircle, AlertCircle, FileText, Clock, Briefcase } from "lucide-react";

export default function ClientsPage() {
    const { clients, addClient, caseTypes } = useFirmData();
    const [newClient, setNewClient] = useState({
        name: "",
        sponsorName: "",
        caseTypeId: "", // Links to case type template
        billingType: "flat_fee" as "hourly" | "flat_fee",
        flatFeeAmount: "",
        estimatedHours: "", // Auto-populated from case type
        monthlyFee: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // Get selected case type for auto-populating hours
    const selectedCaseType = caseTypes.find(ct => ct.id === newClient.caseTypeId);

    const handleCaseTypeChange = (caseTypeId: string) => {
        const caseType = caseTypes.find(ct => ct.id === caseTypeId);
        setNewClient({
            ...newClient,
            caseTypeId,
            estimatedHours: caseType ? String(caseType.estimatedHours) : ""
        });
    };

    const handleAddClient = async () => {
        if (!newClient.name || !newClient.sponsorName) {
            alert("Please enter at least the Client Name and Sponsor Name.");
            return;
        }
        if (newClient.billingType === "flat_fee" && (!newClient.flatFeeAmount || !newClient.estimatedHours)) {
            alert("For flat fee cases, please enter the Flat Fee Amount and Estimated Hours to complete.");
            return;
        }

        setIsSaving(true);
        try {
            // Get case type name
            const caseTypeName = selectedCaseType?.name || "General";

            await addClient({
                id: Math.random().toString(36).substr(2, 9),
                name: newClient.name,
                sponsorName: newClient.sponsorName,
                caseType: caseTypeName,
                status: "active",
                retainerFee: 0,
                monthlyFee: Number(newClient.monthlyFee) || 0,
                lastCommunication: new Date().toISOString(),
                nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                billingType: newClient.billingType,
                flatFeeAmount: Number(newClient.flatFeeAmount) || 0,
                estimatedHours: Number(newClient.estimatedHours) || 0,
                hoursLogged: 0
            });
            setNewClient({ name: "", sponsorName: "", caseTypeId: "", billingType: "flat_fee", flatFeeAmount: "", estimatedHours: "", monthlyFee: "" });
            alert("New client file created successfully.");
        } catch (error) {
            console.error("Failed to add client:", error);
            alert("Error: Failed to save to database. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    // Get flat fee cases (for display)
    const flatFeeCases = clients.filter(c => c.billingType === 'flat_fee' && c.status === 'active');

    return (
        <div className="min-h-screen p-8 md:p-12 space-y-8 bg-gradient-to-br from-slate-900 via-rose-900/20 to-slate-900">
            <header className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Client Command</h1>
                    <p className="text-white/70 mt-2">Sponsor & Case Management</p>
                </div>
            </header>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Client List */}
                <Card className="col-span-2 bg-card/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle>Active Client Roster</CardTitle>
                        <CardDescription>Cases with flat fee tracking for auto value calculation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client (Inmate)</TableHead>
                                    <TableHead>Sponsor (Payer)</TableHead>
                                    <TableHead>Billing</TableHead>
                                    <TableHead className="text-right">Case Value</TableHead>
                                    <TableHead className="text-right">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client) => {
                                    const lastComm = new Date(client.lastCommunication);
                                    const daysSinceComm = Math.floor((new Date().getTime() - lastComm.getTime()) / (1000 * 3600 * 24));
                                    const isLate = daysSinceComm > 14;

                                    // Calculate progress for flat fee cases
                                    const hoursLogged = client.hoursLogged || 0;
                                    const estimatedHours = client.estimatedHours || 1;
                                    const progress = client.billingType === 'flat_fee' ? Math.min((hoursLogged / estimatedHours) * 100, 100) : 0;

                                    return (
                                        <TableRow key={client.id} className={isLate ? "bg-red-950/20" : ""}>
                                            <TableCell className="font-medium">
                                                <div>{client.name}</div>
                                                <div className="text-xs text-muted-foreground">{client.caseType}</div>
                                            </TableCell>
                                            <TableCell>{client.sponsorName}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        client.billingType === 'flat_fee'
                                                            ? 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                                                            : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                                    }
                                                >
                                                    {client.billingType === 'flat_fee' ? 'FLAT FEE' : 'HOURLY'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {client.billingType === 'flat_fee'
                                                    ? `$${(client.flatFeeAmount || 0).toLocaleString()}`
                                                    : `$${client.monthlyFee}/mo`
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {client.billingType === 'flat_fee' ? (
                                                    <div className="text-xs">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {hoursLogged}/{estimatedHours}h
                                                        </div>
                                                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1 ml-auto">
                                                            <div
                                                                className={`h-full rounded-full ${progress >= 100 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">N/A</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {clients.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No clients found. Add one below.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-6 p-4 border border-white/10 rounded-lg bg-muted/20 space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" /> New Case Intake
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Client Name (Inmate)</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newClient.name}
                                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> Case Type
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newClient.caseTypeId}
                                        onChange={(e) => handleCaseTypeChange(e.target.value)}
                                    >
                                        <option value="">Select Case Type...</option>
                                        {caseTypes.map(ct => (
                                            <option key={ct.id} value={ct.id}>
                                                {ct.name} ({ct.estimatedHours}h)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedCaseType && (
                                        <p className="text-[10px] text-green-500">
                                            Auto-estimate: {selectedCaseType.estimatedHours} hours
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Sponsor Name (Payer)</Label>
                                    <Input
                                        placeholder="Jane Doe (Mom)"
                                        value={newClient.sponsorName}
                                        onChange={(e) => setNewClient({ ...newClient, sponsorName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Billing Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newClient.billingType}
                                        onChange={(e) => setNewClient({ ...newClient, billingType: e.target.value as "hourly" | "flat_fee" })}
                                    >
                                        <option value="flat_fee">Flat Fee Case</option>
                                        <option value="hourly">Hourly Billing</option>
                                    </select>
                                </div>

                                {newClient.billingType === "flat_fee" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <FileText className="w-3 h-3" /> Flat Fee Amount ($)
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="5000.00"
                                                value={newClient.flatFeeAmount}
                                                onChange={(e) => setNewClient({ ...newClient, flatFeeAmount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Estimated Hours
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="50"
                                                value={newClient.estimatedHours}
                                                onChange={(e) => setNewClient({ ...newClient, estimatedHours: e.target.value })}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                {selectedCaseType
                                                    ? `Default: ${selectedCaseType.estimatedHours}h (editable)`
                                                    : "Select case type to auto-fill, or enter manually"}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {newClient.billingType === "hourly" && (
                                    <div className="space-y-2">
                                        <Label>Monthly Fee ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="500.00"
                                            value={newClient.monthlyFee}
                                            onChange={(e) => setNewClient({ ...newClient, monthlyFee: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <Button onClick={handleAddClient} className="w-full" disabled={isSaving}>
                                        {isSaving ? "Creating..." : "Create Case File"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rules & Flat Fee Cases */}
                <div className="space-y-6">
                    {flatFeeCases.length > 0 && (
                        <Card className="bg-purple-500/5 border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2 text-purple-400">
                                    <FileText className="w-4 h-4" />
                                    Active Flat Fee Cases
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {flatFeeCases.slice(0, 5).map(c => {
                                    const hoursLogged = c.hoursLogged || 0;
                                    const estimatedHours = c.estimatedHours || 1;
                                    const valuePerHour = (c.flatFeeAmount || 0) / estimatedHours;

                                    return (
                                        <div key={c.id} className="p-3 rounded-lg border border-white/10 bg-background/50">
                                            <div className="font-medium text-sm">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.caseType}</div>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                                <div>
                                                    <div className="text-muted-foreground">Flat Fee</div>
                                                    <div className="font-bold text-purple-400">${(c.flatFeeAmount || 0).toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Value/Hour</div>
                                                    <div className="font-bold text-green-400">${valuePerHour.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Est. Hours</div>
                                                    <div>{estimatedHours}h</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Logged</div>
                                                    <div>{hoursLogged}h</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-muted/10 border-dashed border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Firm Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="p-3 border border-white/10 rounded bg-card/50 text-card-foreground">
                                <span className="font-bold text-primary">Rule #1:</span> Every client gets an update every 14 days.
                            </div>
                            <div className="p-3 border border-white/10 rounded bg-card/50 text-card-foreground">
                                <span className="font-bold text-primary">Rule #2:</span> Sponsors pay the bills. Keep the sponsor informed.
                            </div>
                            <div className="p-3 border border-primary/30 rounded bg-primary/10 text-xs text-card-foreground">
                                <span className="font-bold text-primary">Note:</span> Communication logs are maintained in Clio and LexTrack Manager.
                            </div>
                            <div className="p-3 border border-purple-500/30 rounded bg-purple-500/10 text-xs text-card-foreground">
                                <span className="font-bold text-purple-400">Tip:</span> Manage case type templates in Settings → Case Types.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
