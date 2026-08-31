"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";

export default function PrayerConfigPage() {
  const [loading, setLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Prayer Schedule</h2>
        <p className="text-muted-foreground">Manage prayer schedule synchronization and provider configuration.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule (Mock) */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Generated for Asia/Jakarta (12 Oct 2026)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">Subuh</span>
                <span className="text-muted-foreground">04:30</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">Syuruq</span>
                <span className="text-muted-foreground">05:45</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/10 p-3">
                <span className="font-bold text-primary">Dzuhur (Current)</span>
                <span className="font-bold text-primary">11:55</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">Ashar (Next)</span>
                <span className="text-muted-foreground">15:10</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">Maghrib</span>
                <span className="text-muted-foreground">17:50</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">Isya</span>
                <span className="text-muted-foreground">19:05</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Source: myQuran Provider (Cached)</span>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
              <CardDescription>Primary backend gateway is currently set to myQuran with EQuran fallback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-md">
                Direct integration to myQuran or EQuran is blocked by architecture rules. All schedules are fetched via the internal backend proxy.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider Status</label>
                <div className="flex items-center justify-between rounded-md border p-3 bg-muted/50">
                  <span className="text-sm">Gateway Health</span>
                  <span className="text-sm font-bold text-emerald-500">ONLINE</span>
                </div>
              </div>
              
              <Button className="w-full mt-2" disabled={loading} onClick={() => setLoading(true)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Force Sync Cache Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Fallback Calculation</CardTitle>
              <CardDescription>Used only when API providers are offline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <label className="text-sm font-medium">Calculation Method</label>
                <Input value="Kemenag RI" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shafii / Hanafi</label>
                <Input value="Standard (Shafii)" disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
