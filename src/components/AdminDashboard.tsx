import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  ChevronLeft, 
  Trash2, 
  Layers, 
  Tag as TagIcon, 
  Calendar, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  FolderOpen 
} from "lucide-react";

interface AdminDashboardProps {
  onBack: () => void;
  passwordVerified: boolean;
}

export default function AdminDashboard({ onBack, passwordVerified }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manage">("upload");
  
  // Upload inputs
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [category, setCategory] = useState("Hentai Manga");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  
  // Actions and Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>(""); // "", "uploading", "compiling"
  const [errorMsg, setErrorMsg] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ mangaId: string; title: string } | null>(null);

  // Management tab states
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [expandedMangaId, setExpandedMangaId] = useState<string | null>(null);
  
  // Custom Confirmation Modal states
  const [deletingManga, setDeletingManga] = useState<any | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<{ manga: any; chapterNum: string } | null>(null);
  const [isDeletingOngoing, setIsDeletingOngoing] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Fetch list of current manual uploads whenever managing tab is selected
  const fetchMangaList = async () => {
    setIsLoadingList(true);
    setListError("");
    try {
      const response = await fetch("/api/secret/manga?password=9221", {
        headers: {
          "x-admin-password": "9221"
        }
      });
      if (!response.ok) {
        throw new Error("Could not resolve local custom index API");
      }
      const data = await response.json();
      if (data.success && data.manga) {
        setMangaList(data.manga);
      } else {
        throw new Error("Invalid schema received from local server catalog");
      }
    } catch (err: any) {
      console.error(err);
      setListError(err.message || "Failed to load uploaded list.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manage") {
      fetchMangaList();
    }
  }, [activeTab]);

  if (!passwordVerified) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950">
        <div className="max-w-md w-full bg-dark-card border border-dark-border p-8 rounded-2xl text-center shadow-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 animate-pulse mb-4" />
          <h2 className="text-xl font-bold text-white font-display mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Please log in via the main application password gateway.
          </p>
          <button
            onClick={onBack}
            className="w-full h-11 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all font-display"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Handle cover file selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  // Handle ZIP file selection
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setErrorMsg("Please upload a valid .zip archive file.");
        return;
      }
      setZipFile(file);
      setErrorMsg("");
    }
  };

  // Drag and drop for ZIP file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropZip = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setErrorMsg("Please upload a valid .zip archive file.");
        return;
      }
      setZipFile(file);
      setErrorMsg("");
    }
  };

  const removeZipFile = () => {
    setZipFile(null);
  };

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!title.trim()) {
      setErrorMsg("Please specify a Manga Title.");
      return;
    }
    if (!chapter.trim()) {
      setErrorMsg("Please clarify the Chapter Number.");
      return;
    }
    if (!zipFile) {
      setErrorMsg("Please upload a ZIP archive file containing the chapter pages.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStage("uploading");

    try {
      const formData = new FormData();
      formData.append("password", "9221"); // Authenticate
      formData.append("title", title.trim());
      formData.append("chapter", chapter.trim());
      formData.append("category", category);
      formData.append("tags", tags.trim());
      
      if (coverFile) {
        formData.append("cover", coverFile);
      }
      
      formData.append("zipFile", zipFile);

      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/secret/upload");

        // Track upload progress dynamically
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
            if (pct >= 100) {
              setUploadStage("compiling");
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error("Response parse failure on server."));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || "Upload compiled with severe internal errors."));
            } catch (e) {
              reject(new Error(`Server returned error code ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network connection lost or rejected by server constraints."));
        xhr.send(formData);
      });

      if (response.success) {
        setUploadStage("done");
        setSuccessInfo({
          mangaId: response.mangaId,
          title: response.title
        });
      } else {
        setUploadStage("error");
        setErrorMsg(response.error || "Internal upload system failed to register this manga.");
      }
    } catch (err: any) {
      console.error(err);
      setUploadStage("error");
      setErrorMsg(err.message || "Connection failure: Could not reach full-stack upload server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform full manga deletion
  const executeDeleteManga = async () => {
    if (!deletingManga) return;
    setIsDeletingOngoing(true);
    try {
      const response = await fetch(`/api/secret/manga/${deletingManga.id}?password=9221`, {
        method: "DELETE",
        headers: {
          "x-admin-password": "9221"
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setMangaList((prev) => prev.filter((m) => m.id !== deletingManga.id));
        if (expandedMangaId === deletingManga.id) {
          setExpandedMangaId(null);
        }
        setDeletingManga(null);
      } else {
        alert(resData.error || "Failed to remove manga record.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Network exception occurred while trying to request deletion.");
    } finally {
      setIsDeletingOngoing(false);
    }
  };

  // Perform single chapter deletion
  const executeDeleteChapter = async () => {
    if (!deletingChapter) return;
    setIsDeletingOngoing(true);
    const { manga, chapterNum } = deletingChapter;
    try {
      const response = await fetch(`/api/secret/manga/${manga.id}/chapter/${chapterNum}?password=9221`, {
        method: "DELETE",
        headers: {
          "x-admin-password": "9221"
        }
      });
      const resData = await response.json();
      if (resData.success) {
        // Update list state locally
        setMangaList((prev) => 
          prev.map((m) => {
            if (m.id === manga.id) {
              return {
                ...m,
                chapters: m.chapters.filter((ch: any) => ch.chapter !== chapterNum)
              };
            }
            return m;
          }).filter((m) => m.chapters.length > 0) // Automatically clean up empty manga or keep them
        );
        setDeletingChapter(null);
      } else {
        alert(resData.error || "Failed to delete target chapter archive.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Network exception occurred while trying to remove chapter pages directory.");
    } finally {
      setIsDeletingOngoing(false);
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setChapter("");
    setCategory("Hentai Manga");
    setTags("");
    setCoverFile(null);
    setCoverPreview("");
    setZipFile(null);
    setSuccessInfo(null);
    setErrorMsg("");
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "hentai manga":
        return "bg-rose-600/20 text-rose-450 border border-rose-500/30";
      case "doujinshi":
        return "bg-pink-600/20 text-pink-400 border border-pink-500/20";
      case "artist cg":
        return "bg-purple-600/20 text-purple-400 border border-purple-500/20";
      case "game cg":
        return "bg-blue-600/20 text-blue-400 border border-blue-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border border-zinc-700";
    }
  };

  return (
    <div id="admin-workspace-layout" className="flex-1 py-8 px-4 sm:px-6 lg:px-8 bg-zinc-950/45 text-zinc-100 flex flex-col justify-start">
      <div className="max-w-5xl w-full mx-auto">
        {/* Breadcrumb section */}
        <button
          id="exit-admin-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-mono mb-6 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Exit Admin Workspace</span>
        </button>

        {/* Dashboard Title Header Block */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-dark-border pb-6 mb-8 gap-4">
          <div>
            <span className="inline-block rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest">
              Secured Root Gateway
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white tracking-tight font-display bg-gradient-to-r from-white to-zinc-450 bg-clip-text text-transparent">
              Hanami Hybrid Admin Panel
            </h1>
            <p className="mt-2 text-zinc-400 text-sm font-sans max-w-2xl leading-normal">
              Curate the ultimate portal environment. Publish custom local archives with automatic fallback override logic, or inspect and prune manual publications instantly.
            </p>
          </div>

          {/* Tab Selector buttons */}
          <div className="flex border border-dark-border p-1 bg-zinc-950/80 rounded-xl max-w-fit">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 h-9 px-4 rounded-lg font-display text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upload" 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Chapter</span>
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex items-center gap-2 h-9 px-4 rounded-lg font-display text-xs font-bold transition-all cursor-pointer ${
                activeTab === "manage" 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Manage Library</span>
              {mangaList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-md bg-black/40 text-rose-350 border border-rose-500/20">
                  {mangaList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab View switching */}
        {activeTab === "upload" ? (
          successInfo ? (
            <div id="upload-success-panel" className="bg-dark-card border border-emerald-950/40 bg-gradient-to-b from-dark-card to-emerald-950/10 p-8 sm:p-12 rounded-2xl text-center shadow-2xl animate-scale-in">
              <div className="mx-auto h-16 w-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-full mb-6">
                <CheckCircle className="h-9 w-9" />
              </div>
              
              <h2 className="text-2xl font-bold font-display text-white mb-2">Chapter Upload Success!</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                <span className="font-semibold text-emerald-400">{successInfo.title}</span> has been compiled and cataloged. Zip contents were processed sequentially & mapped directly into our hybrid database.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto h-11 px-6 bg-zinc-800 text-white font-bold text-xs rounded-xl hover:bg-zinc-700 transition-all font-display duration-150 cursor-pointer"
                >
                  Upload Another Chapter
                </button>
                
                <button
                  onClick={() => {
                    handleResetForm();
                    setActiveTab("manage");
                  }}
                  className="w-full sm:w-auto h-11 px-6 border border-dark-border bg-transparent text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-900 transition-all font-display duration-150 cursor-pointer"
                >
                  View Library Index
                </button>
                
                <button
                  onClick={onBack}
                  className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs rounded-xl hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-600/10 transition-all font-display duration-150 cursor-pointer"
                >
                  Go to Public Catalog
                </button>
              </div>
            </div>
          ) : (
            <div id="upload-form-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Context guidelines sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  <div className="bg-dark-card/35 border border-dark-border p-5 rounded-2xl">
                    <h3 className="font-display font-bold text-sm text-white mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-4.5 w-4.5 text-rose-500" />
                      <span>Library Merging Logic</span>
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This is a <b>Hybrid Content Management Portal</b>. Manual chapters are prioritively index-mapped over external scrapers using title and slug matching overrides. 
                    </p>
                    <ul className="mt-3.5 space-y-2 text-[11px] font-mono text-zinc-500 max-w-sm">
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Covers default automatically if not designated.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Upload files in compressed .zip packages.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>Pagination sorting maps files by serial strings.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border border-dark-border/40 bg-zinc-950/20 p-4.5 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-350">Optimal File Prep:</h4>
                      <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed font-mono">
                        Rename pages serialized: <code className="text-zinc-400 bg-black px-1 rounded">01.webp</code>, <code className="text-zinc-400 bg-black px-1 rounded">02.webp</code> for absolute perfect order. Avoid folders inside ZIPs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Input Column */}
              <div className="lg:col-span-2">
                <form id="manga-upload-form" onSubmit={handleSubmit} className="bg-dark-card border border-dark-border p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
                  {errorMsg && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-950 bg-red-950/20 p-4 text-xs text-red-400">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 animate-bounce" />
                      <span className="font-semibold leading-none">{errorMsg}</span>
                    </div>
                  )}

                  {/* Title & Category Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450">
                        Manga / Title Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. My Demon Servant"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setErrorMsg(""); }}
                        disabled={isSubmitting}
                        className="w-full h-11 px-4 rounded-xl border border-dark-border bg-zinc-950/60 text-white text-xs outline-none focus:border-rose-600 transition-colors placeholder:text-zinc-750"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450">
                        Content Category Slot
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-11 px-4 rounded-xl border border-dark-border bg-zinc-950/80 text-white text-xs outline-none focus:border-rose-600 transition-colors cursor-pointer"
                      >
                        <option value="Hentai Manga">Hentai Manga</option>
                        <option value="Doujinshi">Doujinshi</option>
                        <option value="Artist CG">Artist CG</option>
                        <option value="Game CG">Game CG</option>
                      </select>
                    </div>
                  </div>

                  {/* Chapters & Custom Tags Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 space-y-1.5">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450 text-center sm:text-left">
                        Ch. Number / ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01, 10.5, 45"
                        value={chapter}
                        onChange={(e) => { setChapter(e.target.value); setErrorMsg(""); }}
                        disabled={isSubmitting}
                        className="w-full h-11 px-4 rounded-xl border border-dark-border bg-zinc-950/60 text-white text-xs outline-none focus:border-rose-600 text-center transition-colors placeholder:text-zinc-750 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450">
                        Custom Cover Tags (Comma Separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Full Color, Uncensored, Anal, Sister"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-11 px-4 rounded-xl border border-dark-border bg-zinc-950/60 text-white text-xs outline-none focus:border-rose-600 transition-colors placeholder:text-zinc-750"
                      />
                    </div>
                  </div>

                  {/* Poster Image / Cover */}
                  <div className="space-y-2">
                    <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450">
                      Poster Image Card (Cover Art)
                    </label>
                    <div className="flex items-center gap-5">
                      <div 
                        onClick={() => !isSubmitting && coverInputRef.current?.click()}
                        className="h-28 w-20 flex-shrink-0 border-2 border-dashed border-dark-border hover:border-zinc-500 rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all relative bg-zinc-950/40"
                      >
                        {coverPreview ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={coverPreview} 
                            alt="Cover preview" 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-zinc-700 animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={coverInputRef}
                          accept="image/*"
                          onChange={handleCoverChange}
                          disabled={isSubmitting}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={isSubmitting}
                          className="h-9 px-4 rounded-lg border border-dark-border bg-zinc-900/50 hover:bg-zinc-855 text-zinc-300 transition-colors text-xs font-semibold cursor-pointer"
                        >
                          {coverFile ? "Change Image" : "Choose Cover File"}
                        </button>
                        <p className="mt-1.5 text-[10px] font-mono text-zinc-650">
                          Optional JPEG/PNG. Defaults to high contrast nature placeholders if left blank.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ZIP Archive Drag & Drop Selection Area */}
                  <div className="space-y-2">
                    <label className="block text-3xs font-mono font-bold uppercase tracking-widest text-zinc-450 flex items-center justify-between">
                      <span>Manga Pages ZIP Archive (*.zip)</span>
                      {zipFile && <span className="font-mono text-[10px] text-zinc-500 font-semibold">Active File Selected</span>}
                    </label>

                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDropZip}
                      onClick={() => !isSubmitting && zipInputRef.current?.click()}
                      className="border-2 border-dashed border-dark-border hover:border-rose-500/70 rounded-xl p-8 text-center bg-zinc-950/25 hover:bg-zinc-950/40 transition-colors duration-200 cursor-pointer"
                    >
                      <input
                        type="file"
                        ref={zipInputRef}
                        accept=".zip"
                        onChange={handleZipChange}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                      <Upload className="mx-auto h-8 w-8 text-rose-500 animate-pulse mb-3" />
                      <p className="text-zinc-350 text-xs font-semibold font-display">
                        Drag & Drop .zip Archive Here
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-550 font-mono">
                        or click to select your ZIP file from local disk
                      </p>
                    </div>

                    {/* ZIP Selection details */}
                    {zipFile && (
                      <div className="mt-3 border border-dark-border bg-zinc-950/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden mr-4">
                          <FileText className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-zinc-300 truncate font-mono">{zipFile.name}</p>
                            <p className="text-[10px] font-mono text-zinc-550">{(zipFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeZipFile(); }}
                          className="p-1.5 text-zinc-600 hover:text-red-400 bg-zinc-900 border border-dark-border rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submitting Buttons / Progress Area */}
                  <div className="pt-4 border-t border-zinc-900/60 space-y-4">
                    {isSubmitting && (
                      <div className="rounded-xl border border-dark-border bg-zinc-950/90 p-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                          <span className="text-zinc-400 flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                            <span>
                              {uploadStage === "uploading" 
                                ? "Uploading original raw chapter payload..." 
                                : "Decompressing & compiling image sheets..."
                              }
                            </span>
                          </span>
                          <span className="text-rose-500">{uploadProgress}%</span>
                        </div>
                        
                        <div className="w-full bg-zinc-900 rounded-full h-2 relative overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              uploadStage === "uploading" ? "bg-rose-600 bg-gradient-to-r from-rose-600 to-pink-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>

                        <p className="text-[10px] font-mono text-zinc-600 text-center leading-normal">
                          {uploadStage === "uploading" 
                            ? "Streaming database packets directly to local host servers. Do not close browser tab." 
                            : "Decompressing pages, filtering MAC system artifacts, and sorting filenames numerically to secure exact presentation."}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-xl shadow-rose-600/10 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-white animate-pulse" />
                          <span>Preparing files ({uploadProgress}%)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Upload className="h-3 w-3" />
                          <span>Initiate Dynamic Compilation Process</span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        ) : (
          /* MANAGING TAB WORKSPACE */
          <div id="manage-library-workspace" className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h2 className="text-sm font-mono font-bold tracking-wider text-zinc-450 uppercase flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-rose-500" />
                <span>Custom Publications File System</span>
              </h2>

              <button
                onClick={fetchMangaList}
                disabled={isLoadingList}
                className="inline-flex items-center gap-1.5 text-xs text-rose-450 hover:text-rose-400 transition-colors cursor-pointer bg-zinc-950/80 hover:bg-zinc-900 border border-dark-border py-1 px-2.5 rounded-lg active:scale-95 duration-100 font-mono"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingList ? "animate-spin" : ""}`} />
                <span>Sync Index</span>
              </button>
            </div>

            {isLoadingList ? (
              <div className="py-24 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto mb-3" />
                <p className="text-xs text-zinc-500 font-mono">Synchronizing active disk metadata...</p>
              </div>
            ) : listError ? (
              <div className="rounded-xl border border-red-950 bg-red-950/20 p-5 text-center max-w-xl mx-auto space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-xs text-red-300 font-mono">Synchronicity Error: {listError}</p>
                <button
                  onClick={fetchMangaList}
                  className="px-4 py-1.5 bg-red-950/60 hover:bg-red-900 text-white rounded-lg text-xs font-mono font-bold border border-red-500/20 transition-all cursor-pointer"
                >
                  Force Retry
                </button>
              </div>
            ) : mangaList.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-dark-border/60 rounded-2xl bg-zinc-950/25 max-w-xl mx-auto p-8">
                <FolderOpen className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-white text-sm mb-1">Local Index Empty</h3>
                <p className="text-xs text-zinc-500 leading-normal max-w-xs mx-auto mb-6">
                  No manually loaded titles are currently registered on server storage. Use the "Upload Chapter" tab to compile content.
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="px-4 h-9 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform cursor-pointer"
                >
                  Upload First Chapter
                </button>
              </div>
            ) : (
              /* Manga Records list grid */
              <div className="space-y-4">
                {mangaList.map((m) => {
                  const isExpanded = expandedMangaId === m.id;
                  return (
                    <div
                      key={m.id}
                      className="border border-dark-border bg-dark-card/65 rounded-xl overflow-hidden transition-all duration-200"
                    >
                      {/* Main manga summary card row */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
                          {/* Image thumbnail */}
                          <div className="h-20 w-14 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0 border border-dark-border">
                            <img
                              referrerPolicy="no-referrer"
                              src={m.cover}
                              alt={m.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&q=80";
                              }}
                            />
                          </div>
                          
                          {/* Metadata titles */}
                          <div className="overflow-hidden space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md font-display">
                                {m.title}
                              </h3>
                              <span className={`rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getCategoryColor(m.category)}`}>
                                {m.category}
                              </span>
                            </div>

                            <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {m.posted || "N/A"}
                              </span>
                              <span>•</span>
                              <span>Chapters Index: {m.chapters?.length || 0}</span>
                            </p>

                            {/* Tags bubble display */}
                            {m.tags && m.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {m.tags.slice(0, 4).map((tag: string, idx: number) => (
                                  <span key={idx} className="bg-zinc-950/60 border border-dark-border text-zinc-450 rounded px-1.5 py-0.5 text-[9px] font-sans font-medium">
                                    {tag}
                                  </span>
                                ))}
                                {m.tags.length > 4 && (
                                  <span className="text-[9px] font-mono text-zinc-650 px-1">
                                    +{m.tags.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expand & Delete Row Action items */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-0 border-zinc-900 pt-3 sm:pt-0">
                          {/* Chapters Toggle button */}
                          <button
                            onClick={() => setExpandedMangaId(isExpanded ? null : m.id)}
                            className="h-9 px-3.5 flex items-center gap-1.5 border border-dark-border rounded-lg bg-zinc-950/50 hover:bg-zinc-900 text-zinc-350 hover:text-white transition-all duration-100 text-xs font-semibold cursor-pointer"
                          >
                            <span>Chapters ({m.chapters?.length || 0})</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                          </button>

                          {/* Full delete button */}
                          <button
                            id={`trash-${m.id}`}
                            onClick={() => setDeletingManga(m)}
                            className="h-9 w-9 flex items-center justify-center border border-red-950/30 text-rose-500/80 hover:text-red-400 bg-red-950/15 hover:bg-red-905 rounded-lg transition-all cursor-pointer"
                            title="Delete entire manga folders"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandible Chapter Grid Details */}
                      {isExpanded && (
                        <div className="border-t border-dark-border bg-black/35 p-4 sm:p-5">
                          <h4 className="text-xs font-mono font-bold tracking-wider text-rose-400 uppercase mb-3.5 flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Pages Chapters Directory index</span>
                          </h4>

                          {(!m.chapters || m.chapters.length === 0) ? (
                            <p className="text-xs text-zinc-650 font-mono italic">No chapters uploaded to this manga entry. You can publish chapters by designating this same Title.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {m.chapters.map((ch: any) => (
                                <div
                                  key={ch.id}
                                  className="flex items-center justify-between border border-dark-border/70 bg-zinc-950/30 p-3 rounded-lg hover:border-zinc-800 transition-colors"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-white font-display">
                                      Chapter {ch.chapter}
                                    </p>
                                    <p className="text-[10px] font-mono text-zinc-500 mt-1">
                                      Image Pages Serial: <span className="text-zinc-400 font-semibold">{ch.pages?.length || 0} pages</span>
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => setDeletingChapter({ manga: m, chapterNum: ch.chapter })}
                                    className="h-8 w-8 flex items-center justify-center border border-zinc-900 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete individual chapter"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OVERLAY 1: Entire Manga record deletion confirmation dialog modal */}
      {deletingManga && (
        <div id="delete-manga-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-950 bg-dark-card p-6 shadow-2xl relative">
            <div className="mx-auto h-12 w-12 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mb-4">
              <AlertCircle className="h-6 w-6 animate-pulse" />
            </div>

            <h3 className="font-display text-lg font-bold text-white mb-2 text-center">Irreversible Action Request</h3>
            
            <p className="text-zinc-400 text-xs text-center mb-5 leading-normal">
              You are selecting to delete <span className="font-bold text-white font-mono bg-zinc-950 px-1 rounded">"{deletingManga.title}"</span>. 
            </p>
            <p className="text-red-400 text-[11px] font-mono text-center mb-6 bg-red-950/20 border border-red-950 p-2.5 rounded-lg leading-normal">
              <b>Warning:</b> This terminates the database schema index AND forcefully parses a deep directory RM remove command erasing all cover art files, images, and folders permanently.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                disabled={isDeletingOngoing}
                onClick={() => setDeletingManga(null)}
                className="flex-1 h-10 border border-dark-border bg-transparent hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingOngoing}
                onClick={executeDeleteManga}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-600/10 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOngoing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Destroy Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2: Single Chapter record deletion confirmation dialog modal */}
      {deletingChapter && (
        <div id="delete-chapter-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-red-955 bg-dark-card p-6 shadow-2xl relative">
            <div className="mx-auto h-12 w-12 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mb-4">
              <AlertCircle className="h-6 w-6 animate-pulse" />
            </div>

            <h3 className="font-display text-lg font-bold text-white mb-2 text-center font-sans">Delete Chapter {deletingChapter.chapterNum}?</h3>
            
            <p className="text-zinc-400 text-xs text-center mb-5 leading-normal font-sans">
              Are you sure you want to remove <span className="font-semibold text-white">Chapter {deletingChapter.chapterNum}</span> from <span className="font-bold underline text-rose-350">"{deletingChapter.manga.title}"</span>?
            </p>
            <p className="text-red-400 text-[10px] font-mono text-center mb-6 leading-relaxed bg-red-950/15 py-1.5 px-3 rounded border border-red-950/40">
              Only the files associated with this single chapter folder will be unmapped and purged.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                disabled={isDeletingOngoing}
                onClick={() => setDeletingChapter(null)}
                className="flex-1 h-10 border border-dark-border bg-transparent hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingOngoing}
                onClick={executeDeleteChapter}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-600/10 cursor-pointer disabled:opacity-50"
              >
                {isDeletingOngoing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
