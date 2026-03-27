"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  FolderPlus, 
  Image as ImageIcon, 
  X,
  Loader2,
  Upload,
  Camera,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface Album {
  id: string;
  title: string;
  coverImage: string;
  itemCount: number;
  date: string;
  media: MediaItem[];
  createdAt?: any;
}

const ITEMS_PER_PAGE = 5;

export default function GalleryPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState<Partial<Album> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "albums"));
      const docsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Album[];
      
      // Sort by creation desc
      docsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return b.date.localeCompare(a.date);
      });
      
      setAlbums(docsList);
    } catch (error) {
      console.error("Error fetching albums:", error);
      toast.error("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm("Are you sure you want to delete this album?")) {
      try {
        await deleteDoc(doc(db, "albums", id));
        setAlbums(albums.filter(a => a.id !== id));
        
        await logActivity("system", user?.email?.split('@')[0] || "Admin", `deleted gallery album: ${title}`, "warning");
        toast.success("Album deleted successfully");
      } catch (error) {
        console.error("Error deleting album:", error);
        toast.error("Failed to delete album");
      }
    }
  };

  const openModal = (album: Album | null = null) => {
    setCurrentAlbum(album || { title: "", coverImage: "", date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), media: [] });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading and optimizing cover image...");
      const imageUrl = await uploadToCloudinary(file);
      
      if (currentAlbum) {
        setCurrentAlbum({ ...currentAlbum, coverImage: imageUrl });
      }
      toast.success("Cover image uploaded!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsMediaUploading(true);
      const toastId = toast.loading(`Uploading ${files.length} media items...`);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadToCloudinary(file);
        const type = file.type.startsWith('video/') ? "video" : "image";
        return {
          id: Math.random().toString(36).substr(2, 9),
          url,
          type: type as "image" | "video"
        };
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      
      if (currentAlbum) {
        const existingMedia = currentAlbum.media || [];
        const newMedia = [...existingMedia, ...uploadedMedia];
        setCurrentAlbum({ 
          ...currentAlbum, 
          media: newMedia,
          itemCount: newMedia.length
        });
      }
      
      toast.success(`${uploadedMedia.length} items uploaded!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Some uploads failed. Please try again.");
    } finally {
      setIsMediaUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const removeMediaItem = (mediaId: string) => {
    if (currentAlbum && currentAlbum.media) {
      const newMedia = currentAlbum.media.filter(m => m.id !== mediaId);
      setCurrentAlbum({ 
        ...currentAlbum, 
        media: newMedia,
        itemCount: newMedia.length
      });
    }
  };

  const saveAlbum = async () => {
    if (!currentAlbum?.title || !currentAlbum?.coverImage) {
      toast.error("Title and Cover Image are required");
      return;
    }

    try {
      const adminName = user?.email?.split('@')[0] || "Admin";

      if (currentAlbum.id) {
        const docRef = doc(db, "albums", currentAlbum.id);
        const { id, ...updateData } = currentAlbum;
        await updateDoc(docRef, {
          ...updateData,
          media: currentAlbum.media || [],
          itemCount: currentAlbum.media?.length || 0
        });
        
        await logActivity("system", adminName, `updated gallery album: ${currentAlbum.title}`, "info");
        toast.success("Album updated");
      } else {
        const newDoc = {
          ...currentAlbum,
          media: currentAlbum.media || [],
          itemCount: currentAlbum.media?.length || 0,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "albums"), newDoc);
        
        await logActivity("system", adminName, `created new gallery album: ${currentAlbum.title}`, "success");
        toast.success("New album created");
      }
      setIsModalOpen(false);
      fetchAlbums();
    } catch (error) {
      console.error("Error saving album:", error);
      toast.error("Failed to save album");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil((albums.length + 1) / ITEMS_PER_PAGE); 
  const paginatedItems = () => {
    const blendedArray = [...albums, "ADD_CARD" as const];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return blendedArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery & Media</h1>
          <p className="text-gray-500 text-sm mt-1">Organize event photos and videos into albums for the website.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Album
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
            {paginatedItems().map((item, index) => {
              if (item === "ADD_CARD") {
                return (
                  <button 
                    key="add-card"
                    onClick={() => openModal()}
                    className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group"
                  >
                    <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
                      <FolderPlus size={32} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Create New Album</span>
                  </button>
                );
              }

              const album = item as Album;
              return (
                <div key={album.id || index} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 mb-4 bg-gray-100">
                    <Image 
                      src={album.coverImage} 
                      alt={album.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    
                    <div className="absolute top-4 right-4 flex space-x-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(album); }}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-indigo-600 transition-all"
                      >
                        <ImageIcon size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(album.id, album.title); }}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">{album.title}</h3>
                      <div className="flex items-center text-indigo-200 text-xs font-bold uppercase tracking-wider">
                        <span>{album.itemCount} Items</span>
                        <span className="mx-2">•</span>
                        <span>{album.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm mt-8">
              <p className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, albums.length + 1)}</span> of <span className="font-bold text-gray-900">{albums.length + 1}</span> albums
              </p>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors",
                      currentPage === i + 1 
                        ? "border-indigo-200 bg-indigo-50 text-indigo-600" 
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentAlbum?.id ? "Edit Album" : "New Album"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isUploading}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div 
                className={cn(
                  "relative aspect-video rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-300 transition-all",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                ) : currentAlbum?.coverImage ? (
                  <>
                    <Image src={currentAlbum.coverImage} fill sizes="(max-width: 768px) 100vw, 500px" alt="Cover" className="object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera size={32} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Upload Cover Image</p>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Album Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter album title"
                  value={currentAlbum?.title || ""}
                  onChange={(e) => setCurrentAlbum({ ...currentAlbum, title: e.target.value })}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Album Media ({currentAlbum?.media?.length || 0})</label>
                  <button 
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={isMediaUploading}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
                  >
                    {isMediaUploading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
                    Add Photos/Videos
                  </button>
                  <input 
                    type="file" 
                    ref={mediaInputRef}
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {currentAlbum?.media?.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-lg bg-gray-100 overflow-hidden group/media">
                      {item.type === 'image' ? (
                        <Image src={item.url} fill sizes="100px" alt="Media" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Camera size={20} className="text-gray-400" />
                          <div className="absolute top-1 left-1 bg-black/50 rounded-md px-1 py-0.5">
                            <span className="text-[8px] text-white font-bold uppercase tracking-widest">Video</span>
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={() => removeMediaItem(item.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover/media:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {currentAlbum?.media?.length === 0 && (
                    <div className="col-span-4 py-8 text-center border border-dashed border-gray-100 rounded-xl">
                      <p className="text-xs text-gray-400">No media added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                Cancel
              </button>
              <button 
                onClick={saveAlbum}
                disabled={isUploading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {currentAlbum?.id ? "Update Album" : "Create Album"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
