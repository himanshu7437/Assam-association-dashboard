"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Camera, 
  X,
  Loader2,
  Upload,
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

interface Service {
  id: string;
  name: string;
  description: string;
  image: string;
  category: "Facility" | "Service" | "Accommodation";
  price?: string;
  createdAt?: any;
}

const ITEMS_PER_PAGE = 5;

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "services"));
      const docsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      // Sort by creation or fallback to name
      docsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return a.name.localeCompare(b.name);
      });
      
      setServices(docsList);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm("Are you sure you want to delete this service/facility entry?")) {
      try {
        await deleteDoc(doc(db, "services", id));
        setServices(services.filter(s => s.id !== id));
        
        await logActivity("system", user?.email?.split('@')[0] || "Admin", `deleted facility: ${name}`, "warning");
        toast.success("Entry removed");
      } catch (error) {
        console.error("Error deleting service:", error);
        toast.error("Failed to delete entry");
      }
    }
  };

  const openModal = (service: Service | null = null) => {
    setCurrentService(service || { name: "", description: "", image: "", category: "Facility", price: "" });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading and optimizing service image...");
      
      const imageUrl = await uploadToCloudinary(file);
      
      if (currentService) {
        setCurrentService({ ...currentService, image: imageUrl });
      }
      
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const saveService = async () => {
    if (!currentService?.name || !currentService?.image) {
      toast.error("Name and Image are required");
      return;
    }

    try {
      const adminName = user?.email?.split('@')[0] || "Admin";

      if (currentService.id) {
        const docRef = doc(db, "services", currentService.id);
        const { id, ...updateData } = currentService;
        await updateDoc(docRef, updateData as any);
        
        await logActivity("system", adminName, `updated facility: ${currentService.name}`, "info");
        toast.success("Service updated");
      } else {
        const newDoc = {
          ...currentService,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "services"), newDoc);
        
        await logActivity("system", adminName, `added new facility: ${currentService.name}`, "success");
        toast.success("New service added");
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Failed to save service");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil((services.length + 1) / ITEMS_PER_PAGE); // +1 is for the "Add Card"
  const paginatedItems = () => {
    // Array includes all real services plus a placeholder "ADD_CARD"
    const blendedArray = [...services, "ADD_CARD" as const];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return blendedArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services & Facilities</h1>
          <p className="text-gray-500 text-sm mt-1">Manage information about auditorium, guest house, and other services.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Facility
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
            {paginatedItems().map((item, index) => {
              if (item === "ADD_CARD") {
                return (
                  <button 
                    key="add-card"
                    onClick={() => openModal()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group min-h-[300px]"
                  >
                    <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
                      <Plus size={32} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Add Service / Facility</span>
                  </button>
                );
              }

              const service = item as Service;
              return (
                <div key={service.id || index} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image 
                      src={service.image} 
                      alt={service.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-indigo-600 uppercase tracking-widest rounded-full shadow-sm">
                        {service.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{service.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">{service.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-sm font-bold text-indigo-600">
                        {service.price || "Free Service"}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openModal(service)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, services.length + 1)}</span> of <span className="font-bold text-gray-900">{services.length + 1}</span> items
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
              <h2 className="text-xl font-bold">{currentService?.id ? "Edit Facility" : "Add Facility"}</h2>
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
                  "relative h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-300 transition-all",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                ) : currentService?.image ? (
                  <>
                    <Image src={currentService.image} fill sizes="(max-width: 768px) 100vw, 500px" alt="Service" className="object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera size={32} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Upload Image</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Facility name"
                    value={currentService?.name || ""}
                    onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentService?.category || "Facility"}
                    onChange={(e) => setCurrentService({ ...currentService, category: e.target.value as Service["category"] })}
                  >
                    <option>Facility</option>
                    <option>Accommodation</option>
                    <option>Service</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Price (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. ₹15,000 / day"
                  value={currentService?.price || ""}
                  onChange={(e) => setCurrentService({ ...currentService, price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="Describe the facility..."
                  value={currentService?.description || ""}
                  onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                />
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
                onClick={saveService}
                disabled={isUploading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {currentService?.id ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
