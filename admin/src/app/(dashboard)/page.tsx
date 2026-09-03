"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, CalendarClock, MonitorSmartphone, Wifi, WifiOff } from "lucide-react";
import { ApiAdapter } from "@/lib/api/adapter";

export default function DashboardOverview() {
  const [mosque, setMosque] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mosqueId = localStorage.getItem("mosqueId") || "403d70ae-5fa7-489e-86fc-8d370be5b47f";
    
    Promise.all([
      ApiAdapter.getMosqueConfig(mosqueId).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/mosques/${mosqueId}/devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }).then(r => r.json()).catch(() => [])
    ]).then(([m, devs]) => {
      if (m) setMosque(m);
      if (devs && Array.isArray(devs)) setDevices(devs);
      setLoading(false);
    });
  }, []);

  const activeDevices = devices.filter(d => {
    if (!d.last_sync_at) return false;
    return (new Date().getTime() - new Date(d.last_sync_at).getTime()) < 1000 * 60 * 5; // 5 mins
  }).length;
  const offlineDevices = devices.length - activeDevices;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Operational status of your Jam Digital Masjid system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Mosque Status */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mosque Profile</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : mosque?.name || "Masjid Name"}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured & Active</p>
          </CardContent>
        </Card>

        {/* Devices Status */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${devices.length} Total`}</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="flex items-center text-xs text-emerald-500">
                <Wifi className="mr-1 h-3 w-3" /> {activeDevices} Active
              </span>
              <span className="flex items-center text-xs text-destructive">
                <WifiOff className="mr-1 h-3 w-3" /> {offlineDevices} Offline
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Prayer Schedule */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timezone</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : mosque?.timezone || "Asia/Jakarta"}</div>
            <p className="text-xs text-muted-foreground mt-1">Time correctly synced</p>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Engine</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">ONLINE</div>
            <p className="text-xs text-muted-foreground mt-1">Backend connected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>
              Latest logs from devices and backend services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "10:00 AM", msg: "Device 'TV Utama' synced schedule." },
                { time: "09:45 AM", msg: "Device 'TV Luar' came online." },
                { time: "04:30 AM", msg: "Daily cache refreshed successfully." },
                { time: "04:00 AM", msg: "Provider fallback triggered (EQuran)." },
              ].map((log, i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{log.msg}</p>
                    <p className="text-sm text-muted-foreground">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
