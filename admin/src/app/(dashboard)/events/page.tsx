"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Edit, Trash2 } from "lucide-react";

export default function EventsPage() {
  const events = [
    { id: 1, title: "Kajian Rutin Ba'da Maghrib", date: "Every Friday", status: "ACTIVE" },
    { id: 2, title: "Pengajian Akbar", date: "2026-11-01", status: "UPCOMING" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events Management</h2>
          <p className="text-muted-foreground">Manage mosque events and agendas displayed on the digital signage.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Upcoming & Routine Events</CardTitle>
          <CardDescription>
            These events will scroll or appear on the digital board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 p-4 font-medium text-sm text-muted-foreground">
              <div className="col-span-6">Title</div>
              <div className="col-span-3">Date/Time</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            <div className="divide-y">
              {events.map((evt) => (
                <div key={evt.id} className="grid grid-cols-12 p-4 text-sm items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-6 font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {evt.title}
                  </div>
                  <div className="col-span-3 text-muted-foreground">{evt.date}</div>
                  <div className="col-span-1">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {evt.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
