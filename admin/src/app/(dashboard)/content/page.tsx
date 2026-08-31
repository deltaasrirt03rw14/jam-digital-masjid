"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, Loader2, Image as ImageIcon, Video, Type } from "lucide-react";
import { ApiAdapter } from "@/lib/api/adapter";

export default function ContentPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    type: "TEXT",
    status: "ACTIVE",
    scheduling: "",
    duration: 10,
    text: "",
    media_id: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contentData, mediaData] = await Promise.all([
        ApiAdapter.getContents(),
        ApiAdapter.getMedia()
      ]);
      setContents(contentData);
      setMediaList(mediaData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (content: any = null) => {
    if (content) {
      setFormData({
        id: content.id,
        title: content.title,
        type: content.type,
        status: content.status,
        scheduling: content.scheduling || "",
        duration: content.content_data?.duration || 10,
        text: content.content_data?.text || "",
        media_id: content.content_data?.media_id || "",
      });
    } else {
      setFormData({
        id: "",
        title: "",
        type: "TEXT",
        status: "ACTIVE",
        scheduling: "",
        duration: 10,
        text: "",
        media_id: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        scheduling: formData.scheduling,
        content_data: {}
      };

      if (formData.type === "TEXT") {
        payload.content_data.text = formData.text;
        payload.content_data.duration = Number(formData.duration);
      } else {
        payload.content_data.media_id = formData.media_id;
        payload.content_data.duration = Number(formData.duration);
      }

      if (formData.id) {
        await ApiAdapter.updateContent(formData.id, payload);
      } else {
        await ApiAdapter.createContent(payload);
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      await ApiAdapter.deleteContent(id);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete content");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TEXT": return <Type className="h-5 w-5 text-blue-500" />;
      case "IMAGE": return <ImageIcon className="h-5 w-5 text-green-500" />;
      case "VIDEO": return <Video className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Deployment</h2>
          <p className="text-muted-foreground">Manage playlist contents for the TV.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Content
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading contents...</div>
        ) : contents.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No content found. Start creating your playlist!</p>
            <Button onClick={() => handleOpenModal()} variant="outline">Create First Content</Button>
          </Card>
        ) : (
          contents.map((item) => (
            <Card key={item.id} className={`flex flex-col sm:flex-row items-center gap-4 p-4 ${item.status === 'INACTIVE' ? 'opacity-50' : ''}`}>
              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {item.content_data?.duration || 10}s</span>
                  {item.scheduling && <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {item.scheduling}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(item)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md border overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit Content' : 'Create Content'}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input required name="title" value={formData.title} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="TEXT">TEXT</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="VIDEO">VIDEO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {formData.type !== "TEXT" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Media</label>
                    <select required name="media_id" value={formData.media_id} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">-- Choose media --</option>
                      {mediaList.filter(m => formData.type === "IMAGE" ? m.mime_type.startsWith("image/") : m.mime_type.startsWith("video/")).map(m => (
                        <option key={m.id} value={m.id}>{m.filename}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.type === "TEXT" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Text Content</label>
                    <textarea required name="text" value={formData.text} onChange={handleChange} rows={3} className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                    <input type="number" min="1" required name="duration" value={formData.duration} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduling (Optional)</label>
                    <input name="scheduling" placeholder="YYYY-MM-DD/YYYY-MM-DD" value={formData.scheduling} onChange={handleChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Content
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
