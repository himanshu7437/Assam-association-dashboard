"use client";

import React, { useState, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  FolderPlus, 
  Image as ImageIcon, 
  MoreVertical, 
  ExternalLink,
  X,
  Loader2,
  Upload,
  Camera
} from "lucide-react";
import Image from "next/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
}

const initialAlbums: Album[] = [
  { 
    id: "1", 
    title: "Bihu Celebration 2024", 
    coverImage: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&q=80&w=800", 
    itemCount: 24, 
    date: "Jan 15, 2024",
    media: []
  },
  { 
    id: "2", 
    title: "Annual General Meeting", 
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800", 
    itemCount: 12, 
    date: "Dec 10, 2023",
    media: []
  },
  { 
    id: "3", 
    title: "Guest House Inauguration", 
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800", 
    itemCount: 18, 
    date: "Oct 22, 2023",
    media: []
  },
];

export default function GalleryPage() {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState<Partial<Album> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this album?")) {
      setAlbums(albums.filter(a => a.id !== id));
      toast.success("Album deleted successfully");
    }
  };

  const openModal = (album: Album | null = null) => {
    setCurrentAlbum(album || { title: "", coverImage: "", date: new Date().toLocaleDateString(), media: [] });
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
    }
  };

  const saveAlbum = () => {
    if (!currentAlbum?.title || !currentAlbum?.coverImage) {
      toast.error("Title and Cover Image are required");
      return;
    }

    if (currentAlbum.id) {
      setAlbums(albums.map(a => a.id === currentAlbum.id ? currentAlbum as Album : a));
      toast.success("Album updated");
    } else {
      const newAlbum = { ...currentAlbum, id: Date.now().toString(), itemCount: 0 } as Album;
      setAlbums([...albums, newAlbum]);
      toast.success("New album created");
    }
    setIsModalOpen(false);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map((album) => (
          <div key={album.id} className="group cursor-pointer">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 mb-4 bg-gray-100">
              <Image 
                src={album.coverImage} 
                alt={album.title} 
                fill 
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
                  onClick={(e) => { e.stopPropagation(); handleDelete(album.id); }}
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
        ))}

        {/* Add Card */}
        <button 
          onClick={() => openModal()}
          className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group"
        >
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
            <FolderPlus size={32} />
          </div>
          <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Create New Album</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentAlbum?.id ? "Edit Album" : "New Album"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
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
                    <Image src={currentAlbum.coverImage} fill alt="Cover" className="object-cover" />
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
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
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
