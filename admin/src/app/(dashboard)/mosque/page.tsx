"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiAdapter, type MosqueConfig } from "@/lib/api/adapter";

export default function MosqueConfigPage() {
  const [config, setConfig] = useState<MosqueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mosqueId = localStorage.getItem("mosqueId");
    if (!mosqueId || mosqueId === "m1") {
      mosqueId = "403d70ae-5fa7-489e-86fc-8d370be5b47f";
    }
    ApiAdapter.getMosqueConfig(mosqueId)
      .then(setConfig)
      .catch((err) => setError("Failed to load mosque configuration"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      let mosqueId = localStorage.getItem("mosqueId");
      if (!mosqueId || mosqueId === "m1") {
        mosqueId = "403d70ae-5fa7-489e-86fc-8d370be5b47f";
      }
      
      const payload = {
        ...config,
        latitude: typeof config.latitude === 'string' ? parseFloat(config.latitude) : config.latitude,
        longitude: typeof config.longitude === 'string' ? parseFloat(config.longitude) : config.longitude,
      };

      const updated = await ApiAdapter.updateMosqueConfig(mosqueId, payload);
      setConfig(updated);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading configuration...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!config) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mosque Configuration</h2>
        <p className="text-muted-foreground">Manage profile and location details for the mosque.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            These details will be displayed on the digital clock devices.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mosque Identifier (ID)</label>
              <Input value={config.id} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">System identifier. Cannot be changed.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mosque Name</label>
                <Input 
                  value={config.name} 
                  onChange={(e) => setConfig({ ...config, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input 
                  value={config.timezone} 
                  onChange={(e) => setConfig({ ...config, timezone: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input 
                value={config.address} 
                onChange={(e) => setConfig({ ...config, address: e.target.value })} 
                required 
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude</label>
                <Input 
                  type="number" 
                  step="any"
                  value={config.latitude} 
                  onChange={(e) => setConfig({ ...config, latitude: parseFloat(e.target.value) })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude</label>
                <Input 
                  type="number"
                  step="any" 
                  value={config.longitude} 
                  onChange={(e) => setConfig({ ...config, longitude: parseFloat(e.target.value) })} 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
