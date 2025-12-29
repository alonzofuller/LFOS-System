"use client";

import { useState } from "react";
import { useFirmData } from "@/context/FirmContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, User } from "lucide-react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function IntelPage() {
    const { employees, financials, clients, taskLogs } = useFirmData();

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "I am the iTeam Legal Intelligence Unit. I have access to your financials, staff performance, and client roster. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", content: input } as Message;
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const contextData = {
                employees,
                financials,
                clientsSummary: clients.map(c => ({
                    status: c.status,
                    lastCommunication: c.lastCommunication,
                    retainerFee: c.retainerFee
                })),
                recentLogs: taskLogs.slice(-10) // Only send last 10 logs to save tokens
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    context: contextData
                })
            });

            if (!response.ok) throw new Error("API Request Failed");

            const data = await response.json();

            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Error: Unable to reach Intelligence Unit. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 md:p-12 space-y-8 h-screen flex flex-col bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900">
            <header className="flex justify-between items-end border-b pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Firm Intelligence
                    </h1>
                    <p className="text-white/70 mt-2">AI-Driven Analysis & Strategy</p>
                </div>
            </header>

            <Card className="flex-1 flex flex-col min-h-0 bg-muted/10">
                <CardHeader className="shrink-0 border-b bg-card/50">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Active Session
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 relative">
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                                <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted border text-foreground'
                                    }`}>
                                    {m.content}
                                </div>
                                {m.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 justify-start animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-muted border text-foreground text-sm">
                                    Analyzing firm data...
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="shrink-0 p-4 border-t bg-card">
                    <form
                        className="flex w-full gap-2"
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    >
                        <Input
                            placeholder="Ask about burn rate, client risk, or staff efficiency..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Execute</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
