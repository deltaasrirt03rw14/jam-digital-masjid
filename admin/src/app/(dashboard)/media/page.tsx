"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, Video, Trash2, Loader2 } from "lucide-react";
import { ApiAdapter } from "@/lib/api/adapter";

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1").replace("/api/v1", "");

  const fetchMedia = () => {
    setLoading(true);
    ApiAdapter.getMedia()
      .then(setMediaItems)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit");
      return;
    }

    setUploading(true);
    try {
      await ApiAdapter.uploadMedia(file);
      fetchMedia();
    } catch (error) {
      console.error(error);
      alert("Failed to upload media");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      await ApiAdapter.deleteMedia(id);
      fetchMedia();
    } catch (error) {
      console.error(error);
      alert("Failed to delete media");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
          <p className="text-muted-foreground">Upload and manage image/video assets.</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/mp4,video/webm" 
          onChange={handleFileChange} 
        />
        <Button onClick={handleUploadClick} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Media"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading media...</div>
        ) : mediaItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">No media files found. Upload some!</div>
        ) : (
          mediaItems.map((item) => (
            <Card key={item.id} className="bg-card/50 backdrop-blur overflow-hidden group">
              <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                {item.mime_type?.startsWith("image/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={BASE_URL + item.url} alt={item.filename} className="w-full h-full object-cover" />
                ) : item.mime_type?.startsWith("video/") ? (
                  <video src={BASE_URL + item.url} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="font-medium text-sm truncate" title={item.filename}>{item.filename}</p>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        <Card 
          className={`bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors h-[180px] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={handleUploadClick}
        >
          {uploading ? <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" /> : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />}
          <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, MP4 up to 50MB</p>
        </Card>
      </div>
    </div>
  );
}
