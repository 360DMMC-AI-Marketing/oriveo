import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, FileText, Search, Database, RefreshCw } from "lucide-react";

export default function KnowledgeBase() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docId, setDocId] = useState("");

  const { data: kbData, isLoading } = useQuery({
    queryKey: ["knowledge-base"],
    queryFn: () => api.get("/voice/knowledge/documents").then((r) => r.data),
  });

  const ingestMutation = useMutation({
    mutationFn: (documents: any[]) => api.post("/voice/knowledge/ingest", { documents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success("Document added to knowledge base");
      setShowAddForm(false);
      setTitle("");
      setContent("");
      setDocId("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add document");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/voice/knowledge/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success("Document removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  const documents = kbData?.documents || [];

  const handleAddDocument = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content required");
      return;
    }
    const id = docId.trim() || `doc-${Date.now()}`;
    ingestMutation.mutate([{ id, title, content }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Documents and context used by AI voice agents during calls
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <Database className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((sum: number, d: any) => sum + (d.chunkCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Method</CardTitle>
            <Search className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Semantic + Keyword</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embedding Model</CardTitle>
            <Database className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">text-embedding-3</div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document ID (optional)</Label>
              <Input
                placeholder="Auto-generated if left empty"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Post-Surgery Care Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Enter the document content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDocument} disabled={ingestMutation.isPending}>
                {ingestMutation.isPending ? "Adding..." : "Add to Knowledge Base"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No documents yet</p>
              <p className="text-sm text-gray-400">
                Add documents to provide context for AI voice agents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {doc.id} &middot; {doc.chunkCount} chunks
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
