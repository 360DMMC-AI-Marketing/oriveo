import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, FileImage, File, Search, X, Download, FileSpreadsheet } from "lucide-react";
import { formatDate } from "@/lib/utils";

const mimeIcon: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="h-8 w-8 text-red-500" />,
  "image/": <FileImage className="h-8 w-8 text-blue-500" />,
};

function getIcon(mime: string) {
  for (const [key, icon] of Object.entries(mimeIcon)) {
    if (mime.startsWith(key)) return icon;
  }
  return <File className="h-8 w-8 text-gray-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => api.get(`/patients/${patientId}/unified`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (did: string) => api.delete(`/patients/${patientId}/documents/${did}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
      toast.success("Document deleted");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Delete failed"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/patients/${patientId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
      toast.success("Document uploaded & OCR processed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const documents = data?.documents || [];
  const filtered = search ? documents.filter((d: any) =>
    d.originalName.toLowerCase().includes(search.toLowerCase()) ||
    d.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase())) ||
    d.docType?.toLowerCase().includes(search.toLowerCase())
  ) : documents;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-8 h-9 text-sm" />
        </div>
        <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleUpload} className="hidden" />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {documents.length === 0 && !search && (
        <p className="text-sm text-gray-500 text-center py-8">No documents uploaded yet</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc: any) => (
          <Card key={doc._id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {getIcon(doc.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.originalName}</p>
                  <p className="text-xs text-gray-500">{formatSize(doc.size)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doc.docType !== "other" && (
                      <Badge variant="secondary" className="text-[10px]">{doc.docType}</Badge>
                    )}
                    {doc.tags?.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-gray-400">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>
              {doc.ocrText && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 border-t pt-1">{doc.ocrText.slice(0, 200)}</p>
              )}
              <div className="flex items-center gap-1 mt-2">
                <button onClick={() => deleteMutation.mutate(doc._id)}
                  className="text-xs text-red-500 hover:text-red-700">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
