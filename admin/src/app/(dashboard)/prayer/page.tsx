"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";

export default function PrayerConfigPage() {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    let mosqueId = localStorage.getItem("mosqueId");
    if (!mosqueId || mosqueId === "m1") {
      mosqueId = "403d70ae-5fa7-489e-86fc-8d370be5b47f";
    }
    
    // Fetch Mosque Config (for timezone)
    ApiAdapter.getMosqueConfig(mosqueId).then(conf => {
      setConfig(conf);
      const tz = conf.timezone || "Asia/Jakarta";
      const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
      
      // Fetch Schedule for today
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/mosques/${mosqueId}/prayer-schedules?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setSchedule(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }).catch(console.error);

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const getPrayerStatus = () => {
    if (!schedule || !config) return { current: null, next: null };
    const tz = config.timezone || "Asia/Jakarta";
    
    const nowStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(currentTime);
    const times = [
      { name: "Subuh", time: schedule.subuh },
      { name: "Syuruq", time: schedule.syuruq },
      { name: "Dzuhur", time: schedule.dzuhur },
      { name: "Ashar", time: schedule.ashar },
      { name: "Maghrib", time: schedule.maghrib },
      { name: "Isya", time: schedule.isya }
    ];

    let current = null;
    let next = null;
    for (let i = 0; i < times.length; i++) {
      if (times[i].time && nowStr >= times[i].time) {
        current = times[i].name;
      } else if (times[i].time) {
        next = times[i].name;
        break;
      }
    }
    if (!next) next = "Subuh (Tomorrow)";
    return { current, next, times };
  };

  const status = getPrayerStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Prayer Schedule</h2>
        <p className="text-muted-foreground">Manage prayer schedule synchronization and provider configuration.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Generated for {config?.timezone || "..."} ({schedule?.date || "..."})</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">Loading schedule...</div>
            ) : schedule ? (
              <div className="space-y-4">
                {status.times.map((p, idx) => {
                  if (!p.time) return null;
                  const isCurrent = p.name === status.current;
                  const isNext = p.name === status.next;
                  return (
                    <div key={idx} className={`flex items-center justify-between rounded-lg border p-3 ${isCurrent ? 'border-primary bg-primary/10' : ''}`}>
                      <span className={`font-medium ${isCurrent ? 'text-primary font-bold' : ''}`}>
                        {p.name} {isCurrent && "(Current)"} {isNext && "(Next)"}
                      </span>
                      <span className={isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}>{p.time.substring(0, 5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>No schedule found for today.</div>
            )}
            
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
              
              <Button className="w-full mt-2" onClick={() => {
                let mosqueId = localStorage.getItem("mosqueId") || "403d70ae-5fa7-489e-86fc-8d370be5b47f";
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/mosques/${mosqueId}/prayer-schedules/sync`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }).then(() => window.location.reload());
              }}>
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
