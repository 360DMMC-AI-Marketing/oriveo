import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search, Heart, Activity, Brain, Wind, Eye, Bone, Droplets,
  Thermometer, Pill, Baby, Stethoscope, Shield, AlertTriangle,
  Sparkles, Plus, Trash2, Star, Layers, Pencil, ClipboardCheck, Save, X, ArrowLeft, ArrowUp, ArrowDown, PawPrint, User
} from "lucide-react";
import { medicalTemplates as sharedTemplates } from "@/data/medicalTemplates";
import { veterinaryTemplates } from "@/data/veterinaryTemplates";
import { dentalTemplates } from "@/data/dentalTemplates";
import { useAuth } from "@/contexts/AuthContext";

const templateDisplay: Record<string, { icon: any; color: string; bg: string; iconBg: string }> = {
  diabetes: { icon: Droplets, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", iconBg: "bg-blue-100 text-blue-600" },
  hypertension: { icon: Heart, color: "from-red-500 to-red-600", bg: "bg-red-50", iconBg: "bg-red-100 text-red-600" },
  "asthma-copd": { icon: Wind, color: "from-teal-500 to-teal-600", bg: "bg-teal-50", iconBg: "bg-teal-100 text-teal-600" },
  "heart-disease": { icon: Activity, color: "from-rose-500 to-rose-600", bg: "bg-rose-50", iconBg: "bg-rose-100 text-rose-600" },
  arthritis: { icon: Bone, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", iconBg: "bg-purple-100 text-purple-600" },
  "depression-anxiety": { icon: Brain, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100 text-indigo-600" },
  thyroid: { icon: Thermometer, color: "from-orange-500 to-orange-600", bg: "bg-orange-50", iconBg: "bg-orange-100 text-orange-600" },
  "kidney-disease": { icon: Shield, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", iconBg: "bg-cyan-100 text-cyan-600" },
  pregnancy: { icon: Baby, color: "from-pink-500 to-pink-600", bg: "bg-pink-50", iconBg: "bg-pink-100 text-pink-600" },
  "post-surgery": { icon: Stethoscope, color: "from-gray-600 to-gray-700", bg: "bg-gray-50", iconBg: "bg-gray-100 text-gray-600" },
  pediatric: { icon: Baby, color: "from-green-400 to-green-500", bg: "bg-green-50", iconBg: "bg-green-100 text-green-600" },
  "general-wellness": { icon: ClipboardCheck, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100 text-emerald-600" },
  "cancer-followup": { icon: AlertTriangle, color: "from-violet-500 to-violet-600", bg: "bg-violet-50", iconBg: "bg-violet-100 text-violet-600" },
  gastrointestinal: { icon: Pill, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100 text-amber-600" },
  neurological: { icon: Brain, color: "from-sky-500 to-sky-600", bg: "bg-sky-50", iconBg: "bg-sky-100 text-sky-600" },
  "elderly-care": { icon: Heart, color: "from-slate-500 to-slate-600", bg: "bg-slate-50", iconBg: "bg-slate-100 text-slate-600" },
  "canine-wellness": { icon: PawPrint, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100 text-amber-600" },
  "feline-wellness": { icon: PawPrint, color: "from-orange-500 to-orange-600", bg: "bg-orange-50", iconBg: "bg-orange-100 text-orange-600" },
  "puppy-vaccination": { icon: Shield, color: "from-green-500 to-green-600", bg: "bg-green-50", iconBg: "bg-green-100 text-green-600" },
  "vet-dental": { icon: Bone, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", iconBg: "bg-cyan-100 text-cyan-600" },
  "heartworm-prevention": { icon: Heart, color: "from-rose-500 to-rose-600", bg: "bg-rose-50", iconBg: "bg-rose-100 text-rose-600" },
  "vet-emergency": { icon: AlertTriangle, color: "from-red-500 to-red-600", bg: "bg-red-50", iconBg: "bg-red-100 text-red-600" },
  "vet-post-surgery": { icon: Stethoscope, color: "from-gray-600 to-gray-700", bg: "bg-gray-50", iconBg: "bg-gray-100 text-gray-600" },
  "vet-dermatology": { icon: Wind, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", iconBg: "bg-purple-100 text-purple-600" },
  "vet-arthritis": { icon: Bone, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100 text-indigo-600" },
  "equine-wellness": { icon: PawPrint, color: "from-amber-700 to-amber-800", bg: "bg-amber-50", iconBg: "bg-amber-100 text-amber-700" },
  "avian-exotic": { icon: PawPrint, color: "from-teal-500 to-teal-600", bg: "bg-teal-50", iconBg: "bg-teal-100 text-teal-600" },
  "general-dental": { icon: Bone, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50", iconBg: "bg-cyan-100 text-cyan-600" },
  "root-canal": { icon: Activity, color: "from-red-500 to-red-600", bg: "bg-red-50", iconBg: "bg-red-100 text-red-600" },
  "orthodontic": { icon: Bone, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", iconBg: "bg-purple-100 text-purple-600" },
  "oral-surgery": { icon: Stethoscope, color: "from-gray-600 to-gray-700", bg: "bg-gray-50", iconBg: "bg-gray-100 text-gray-600" },
  "dental-emergency": { icon: AlertTriangle, color: "from-red-500 to-red-600", bg: "bg-red-50", iconBg: "bg-red-100 text-red-600" },
  "periodontal": { icon: Heart, color: "from-pink-500 to-pink-600", bg: "bg-pink-50", iconBg: "bg-pink-100 text-pink-600" },
  "pediatric-dental": { icon: Baby, color: "from-green-400 to-green-500", bg: "bg-green-50", iconBg: "bg-green-100 text-green-600" },
  "cosmetic-dental": { icon: Sparkles, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", iconBg: "bg-blue-100 text-blue-600" },
};

const finalQuestion = "Do you have anything else you'd like to tell the doctor?";

export default function MedicalTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgType = user?.organization?.type as string | undefined;
  const availableTabs: ("human" | "veterinary" | "dental")[] = !orgType ? ["human", "veterinary", "dental"] :
    orgType === "veterinary" ? ["veterinary"] :
    orgType === "dental" ? ["dental"] :
    ["human"];
  const defaultTab = availableTabs.includes("human") ? "human" : availableTabs[0];
  const [templateTab, setTemplateTab] = useState<"human" | "veterinary" | "dental">(defaultTab);
  const [tab, setTab] = useState<"templates" | "create">("templates");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allVet = veterinaryTemplates.map((t: any) => ({ ...t, ...templateDisplay[t.id] }));
  const allDental = dentalTemplates.map((t: any) => ({ ...t, ...templateDisplay[t.id] }));
  const activeTemplates: any[] = templateTab === "veterinary" ? allVet :
    templateTab === "dental" ? allDental :
    sharedTemplates.map((t: any) => ({ ...t, ...templateDisplay[t.id] }));

  const categories = [...new Set(activeTemplates.map((t: any) => t.category))] as string[];

  const [customizing, setCustomizing] = useState<any | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customQuestions, setCustomQuestions] = useState<{ text: string }[]>([]);

  const [newForm, setNewForm] = useState({ title: "", category: "general", language: "en" });
  const [newQuestions, setNewQuestions] = useState<{ text: string; type: string; followUp: string }[]>([]);
  const [condition, setCondition] = useState("");
  const [generating, setGenerating] = useState(false);

  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: { title: string; questions: { text: string }[]; category: string; language: string }) => {
      const res = await api.post("/questionnaires", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Questionnaire saved successfully!");
      cancelCustomize();
    },
    onError: () => {
      toast.error("Failed to save questionnaire. Please try again.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/questionnaires", data),
    onSuccess: () => {
      setTab("templates");
      setNewForm({ title: "", category: "general", language: "en" });
      setNewQuestions([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong");
    },
  });

  const generateQuestions = async () => {
    if (!condition) return;
    setGenerating(true);
    try {
      const { data } = await api.post("/questionnaires/generate", { condition, language: newForm.language, category: newForm.category });
      setNewQuestions(data.questions.map((q: any) => ({ text: q.text || q, type: q.type || "open", followUp: q.followUp || "" })));
      if (!newForm.title) setNewForm({ ...newForm, title: `${condition} Assessment` });
    } catch (err) {
      toast.error("Failed to generate questions. Ensure your API key is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const addNewQuestion = () => {
    setNewQuestions([...newQuestions, { text: "", type: "open", followUp: "" }]);
  };

  const updateNewQuestion = (index: number, field: string, value: string) => {
    const updated = [...newQuestions];
    (updated[index] as any)[field] = value;
    setNewQuestions(updated);
  };

  const removeNewQuestion = (index: number) => {
    setNewQuestions(newQuestions.filter((_, i) => i !== index));
  };

  const filteredTemplates = activeTemplates.filter((t: any) => {
    const matchSearch = !search || t.condition.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCustomize = (template: any) => {
    setCustomizing(template);
    setCustomTitle(template.condition + " Checkup");
    setCustomQuestions(template.questions.map((q: any) => ({ text: q })));
  };

  const addCustomQuestion = () => {
    setCustomQuestions([...customQuestions, { text: "" }]);
  };

  const updateCustomQuestion = (index: number, text: string) => {
    const updated = [...customQuestions];
    updated[index].text = text;
    setCustomQuestions(updated);
  };

  const removeCustomQuestion = (index: number) => {
    if (customQuestions.length <= 1) return;
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= customQuestions.length) return;
    const updated = [...customQuestions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setCustomQuestions(updated);
  };

  const saveCustomized = () => {
    if (!customTitle.trim()) { toast.error("Please enter a title"); return; }
    if (customQuestions.length === 0 || customQuestions.every((q) => !q.text.trim())) { toast.error("At least one question is required"); return; }
    createFromTemplateMutation.mutate({
      title: customTitle,
      questions: customQuestions.filter((q) => q.text.trim()).map((q, i) => ({ text: q.text, order: i + 1, type: "open" })),
      category: "custom",
      language: "en",
    });
  };

  const cancelCustomize = () => {
    setCustomizing(null);
    setCustomQuestions([]);
    setCustomTitle("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires & Templates</h1>
          <p className="text-gray-500">Choose a medical template, customize it, or create your own</p>
        </div>
        <Button onClick={() => setTab("create")} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Create New
        </Button>
      </div>

      <div className="flex gap-1 border-b pb-1">
        {availableTabs.includes("human") && (
        <button onClick={() => setTemplateTab("human")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${templateTab === "human" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
          <User className="inline h-4 w-4 mr-1.5" />Medical
        </button>
        )}
        {availableTabs.includes("veterinary") && (
        <button onClick={() => setTemplateTab("veterinary")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${templateTab === "veterinary" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
          <PawPrint className="inline h-4 w-4 mr-1.5" />Veterinary
        </button>
        )}
        {availableTabs.includes("dental") && (
        <button onClick={() => setTemplateTab("dental")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${templateTab === "dental" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
          <Bone className="inline h-4 w-4 mr-1.5" />Dental
        </button>
        )}
        <div className="flex-1" />
        <button onClick={() => setTab("templates")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === "templates" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
          <Layers className="inline h-4 w-4 mr-1.5" />Saved
        </button>
      </div>

      {tab === "templates" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search conditions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <option value="">All Specialties</option>
              {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>

          {customizing ? (
            <Card className="border-primary/30">
              <CardHeader className="border-b bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Pencil className="h-5 w-5 text-primary" />
                      Customize: <span className="text-primary">{customizing.condition}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Edit questions below, then save as a new questionnaire</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={cancelCustomize}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Questionnaire Title *</label>
                  <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Enter a title..." />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Questions ({customQuestions.length})</h3>
                    <Button onClick={addCustomQuestion} variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" /> Add Question</Button>
                  </div>
                  {customQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-1 rounded-lg border p-3">
                      <div className="flex flex-col gap-0.5 mt-1 mr-1">
                        <button onClick={() => moveQuestion(i, "up")} disabled={i === 0}
                          className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500" title="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveQuestion(i, "down")} disabled={i === customQuestions.length - 1}
                          className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500" title="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="mt-2.5 shrink-0 text-xs font-medium text-gray-400 w-5">#{i + 1}</span>
                      <div className="flex-1">
                        <Textarea value={q.text} onChange={(e) => updateCustomQuestion(i, e.target.value)}
                          placeholder="Enter question text..." className="min-h-[60px] text-sm" />
                      </div>
                      <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => removeCustomQuestion(i)}
                        disabled={customQuestions.length <= 1}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={saveCustomized} disabled={createFromTemplateMutation.isPending}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {createFromTemplateMutation.isPending ? "Saving..." : "Save Customized Questionnaire"}
                  </Button>
                  <Button variant="outline" onClick={cancelCustomize}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Templates</Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredTemplates.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400"><Search className="mx-auto mb-3 h-8 w-8" /><p>No templates match your search</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template: any) => {
                const Icon = template.icon || Stethoscope;
                const color = template.color || "from-gray-400 to-gray-500";
                const iconBg = template.iconBg || "bg-gray-100 text-gray-600";
                return (
                <Card key={template.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <div className={`h-2 w-full rounded-t-xl bg-gradient-to-r ${color}`} />
                  <CardContent className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        template.severity === "critical" ? "bg-red-100 text-red-700" :
                        template.severity === "high" ? "bg-amber-100 text-amber-700" :
                        template.severity === "moderate" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>{template.severity === "critical" ? "Critical" : template.severity === "high" ? "High Priority" : template.severity === "moderate" ? "Standard" : "Routine"}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{template.condition}</h3>
                    <p className="text-xs text-gray-500 mb-1">{template.category} &middot; {template.questions.length} questions</p>
                    <div className="mt-2 space-y-1">
                      {template.questions.slice(0, expandedId === template.id ? template.questions.length : 3).map((q: any, i: number) => (
                        <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">&bull;</span>{q}</p>
                      ))}
                      {template.questions.length > 3 && (
                        <button onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                          className="mt-1 text-xs text-primary hover:underline">
                          {expandedId === template.id ? "Show less" : `+${template.questions.length - 3} more questions`}
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleCustomize(template)} disabled={!!customizing}>
                        <Pencil className="mr-1 h-4 w-4" /> Customize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </>
      )}

      {tab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Questionnaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Title *</label>
                <Input value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} placeholder="e.g., Post-Surgery Assessment" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <option value="general">General</option>
                  <option value="post-surgery">Post-Surgery</option>
                  <option value="wound-check">Wound Check</option>
                  <option value="chronic">Chronic</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Language</label>
                <select value={newForm.language} onChange={(e) => setNewForm({ ...newForm, language: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <label className="mb-2 block text-sm font-medium">AI Generate Questions</label>
              <div className="flex gap-2">
                <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g., Post-surgery infection check, Diabetes follow-up..." />
                <Button onClick={generateQuestions} disabled={generating || !condition} variant="secondary">
                  <Sparkles className="mr-2 h-4 w-4" /> {generating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Questions ({newQuestions.length} + 1 final)</h3>
                <Button onClick={addNewQuestion} variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" /> Add</Button>
              </div>
              {newQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 grid gap-2">
                    <Input value={q.text} onChange={(e) => updateNewQuestion(i, "text", e.target.value)} placeholder="Question text..." className="text-sm" />
                    <div className="flex gap-2">
                      <select value={q.type} onChange={(e) => updateNewQuestion(i, "type", e.target.value)}
                        className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option value="open">Open</option>
                        <option value="scale">Scale (1-10)</option>
                        <option value="yesno">Yes/No</option>
                      </select>
                      <Input value={q.followUp} onChange={(e) => updateNewQuestion(i, "followUp", e.target.value)} placeholder="Follow-up prompt (optional)" className="flex-1 text-sm" />
                      <Button variant="ghost" size="icon" onClick={() => removeNewQuestion(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-primary/40 bg-primary-light/30 p-3">
                <div className="flex-1 grid gap-2">
                  <p className="text-sm font-medium text-primary">{finalQuestion}</p>
                  <p className="text-xs text-gray-500">Type: Open · Always added as final question</p>
                </div>
                <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Auto</span>
              </div>
              {newQuestions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Add your questions above. The final question is automatic.</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate({ ...newForm, questions: [...newQuestions.map((q) => ({ text: q.text, type: q.type, followUp: q.followUp })), { text: finalQuestion, type: "open" }] })}
                disabled={createMutation.isPending || !newForm.title || newQuestions.length === 0}>
                {createMutation.isPending ? "Saving..." : "Save Questionnaire"}
              </Button>
              <Button variant="outline" onClick={() => { setTab("templates"); setNewQuestions([]); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
