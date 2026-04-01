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
  ChevronRight,
  MinusCircle
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

export type FacilityType = "simple" | "accommodation" | "event";

export interface Room {
  id: string;
  name: string;
  description: string;
  price: number;
  inclusions: string;
  bookingPolicy: string;
  checkIn: string;
  checkOut: string;
  images?: string[];
}

export interface PricingSlot {
  id: string;
  duration: string;
  amount: number;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  image: string;
  gallery?: string[];
  type: FacilityType;
  
  // Accommodation
  rooms?: Room[];
  
  // Event
  pricing?: PricingSlot[];
  bookingPolicy?: string;
  remarks?: string;

  createdAt?: { toMillis: () => number } | any;
}

const ITEMS_PER_PAGE = 5;

export default function ServicesPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFacility, setCurrentFacility] = useState<Partial<Facility> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const roomImageInputRef = useRef<HTMLInputElement>(null);
  const [currentRoomForUpload, setCurrentRoomForUpload] = useState<string | null>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "facilities"));
      const docsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Facility[];
      
      // Sort by creation or fallback to name
      docsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return a.name.localeCompare(b.name);
      });
      
      setFacilities(docsList);
    } catch {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm("Are you sure you want to delete this facility entry?")) {
      try {
        await deleteDoc(doc(db, "facilities", id));
        setFacilities(facilities.filter(f => f.id !== id));
        
        await logActivity("system", user?.email?.split('@')[0] || "Admin", `deleted facility: ${name}`, "warning");
        toast.success("Entry removed");
      } catch {
        toast.error("Failed to delete entry");
      }
    }
  };

  const openModal = (facility: Facility | null = null) => {
    setCurrentFacility(facility || { 
      name: "", 
      description: "", 
      image: "", 
      gallery: [],
      type: "simple",
      rooms: [],
      pricing: [],
      bookingPolicy: "",
      remarks: ""
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading and optimizing facility image...");
      
      const imageUrl = await uploadToCloudinary(file);
      
      if (currentFacility) {
        setCurrentFacility({ ...currentFacility, image: imageUrl });
      }
      
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      const toastId = toast.loading(`Uploading ${files.length} images...`);
      
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const fileUrls = await Promise.all(uploadPromises);
      
      setCurrentFacility(prev => ({
        ...prev,
        gallery: [...(prev?.gallery || []), ...fileUrls]
      }));
      
      toast.success("Gallery images uploaded successfully!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setCurrentFacility(prev => ({
      ...prev,
      gallery: (prev?.gallery || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleRoomImageUpload = async (roomId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingRoomId(roomId);
      const toastId = toast.loading(`Uploading ${files.length} images...`);
      
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const fileUrls = await Promise.all(uploadPromises);
      
      setCurrentFacility(prev => ({
        ...prev,
        rooms: (prev?.rooms || []).map(r => r.id === roomId ? { ...r, images: [...(r.images || []), ...fileUrls] } : r)
      }));
      
      toast.success("Room images uploaded successfully!", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingRoomId(null);
      setCurrentRoomForUpload(null);
      if (roomImageInputRef.current) roomImageInputRef.current.value = "";
    }
  };

  const removeRoomImage = (roomId: string, indexToRemove: number) => {
    setCurrentFacility(prev => ({
      ...prev,
      rooms: (prev?.rooms || []).map(r => 
        r.id === roomId 
          ? { ...r, images: (r.images || []).filter((_, index) => index !== indexToRemove) } 
          : r
      )
    }));
  };

  const saveFacility = async () => {
    if (!currentFacility?.name || !currentFacility?.image) {
      toast.error("Name and Image are required");
      return;
    }

    try {
      setIsSaving(true);
      const adminName = user?.email?.split('@')[0] || "Admin";
      
      // Clean up irrelevant fields based on type
      const dataToSave = { ...currentFacility };
      if (dataToSave.type === 'simple') {
        delete dataToSave.rooms;
        delete dataToSave.pricing;
        delete dataToSave.bookingPolicy;
        delete dataToSave.remarks;
      } else if (dataToSave.type === 'accommodation') {
        delete dataToSave.pricing;
        delete dataToSave.remarks;
        // Keep bookingPolicy possibly, or put it per room? Requirements say per room for accommodation, but keeping global doesn't hurt.
        // Actually, requirements mention bookingPolicy inside room for accommodation.
        delete dataToSave.bookingPolicy; 
      } else if (dataToSave.type === 'event') {
        delete dataToSave.rooms;
      }

      if (currentFacility.id) {
        const docRef = doc(db, "facilities", currentFacility.id);
        const { id, ...updateData } = dataToSave;
        await updateDoc(docRef, updateData as unknown as Record<string, any>);
        
        await logActivity("system", adminName, `updated facility: ${currentFacility.name}`, "info");
        toast.success("Facility updated");
      } else {
        const newDoc = {
          ...dataToSave,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "facilities"), newDoc);
        
        await logActivity("system", adminName, `added new facility: ${currentFacility.name}`, "success");
        toast.success("New facility added");
      }
      setIsModalOpen(false);
      fetchFacilities();
    } catch {
      toast.error("Failed to save facility");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic Array Handlers
  const addRoom = () => {
    setCurrentFacility(prev => ({
      ...prev,
      rooms: [...(prev?.rooms || []), {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        description: "",
        price: 0,
        inclusions: "",
        bookingPolicy: "",
        checkIn: "",
        checkOut: "",
        images: []
      }]
    }));
  };

  const removeRoom = (id: string) => {
    setCurrentFacility(prev => ({
      ...prev,
      rooms: (prev?.rooms || []).filter(r => r.id !== id)
    }));
  };

  const updateRoom = (id: string, field: keyof Room, value: string | number | string[]) => {
    setCurrentFacility(prev => ({
      ...prev,
      rooms: (prev?.rooms || []).map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const addPricingSlot = () => {
    setCurrentFacility(prev => ({
      ...prev,
      pricing: [...(prev?.pricing || []), {
        id: Math.random().toString(36).substr(2, 9),
        duration: "",
        amount: 0
      }]
    }));
  };

  const removePricingSlot = (id: string) => {
    setCurrentFacility(prev => ({
      ...prev,
      pricing: (prev?.pricing || []).filter(p => p.id !== id)
    }));
  };

  const updatePricingSlot = (id: string, field: keyof PricingSlot, value: string | number) => {
    setCurrentFacility(prev => ({
      ...prev,
      pricing: (prev?.pricing || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Pagination Logic
  const totalPages = Math.ceil((facilities.length + 1) / ITEMS_PER_PAGE);
  const paginatedItems = () => {
    const blendedArray = [...facilities, "ADD_CARD" as const];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return blendedArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getDisplayPrice = (facility: Facility) => {
    if (facility.type === "accommodation" && facility.rooms && facility.rooms.length > 0) {
      const minPrice = Math.min(...facility.rooms.map(r => Number(r.price) || 0));
      return minPrice > 0 ? `Starts from ₹${minPrice}` : "Contact for pricing";
    }
    if (facility.type === "event" && facility.pricing && facility.pricing.length > 0) {
      const minPrice = Math.min(...facility.pricing.map(p => Number(p.amount) || 0));
      return minPrice > 0 ? `Starts from ₹${minPrice}` : "Contact for pricing";
    }
    return "";
  };

  const getFacilityTypeLabel = (type: string) => {
    switch(type) {
      case 'simple': return 'Facility';
      case 'accommodation': return 'Accommodation';
      case 'event': return 'Event Space';
      default: return 'Facility';
    }
  };

  return (
    <div className="space-y-6 pb-20">
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
      <input 
        type="file" 
        ref={galleryInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple
        onChange={handleGalleryUpload}
      />
      <input 
        type="file" 
        ref={roomImageInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple
        onChange={(e) => {
          if (currentRoomForUpload) {
            handleRoomImageUpload(currentRoomForUpload, e);
          }
        }}
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

              const facility = item as Facility;
              const displayPrice = getDisplayPrice(facility);

              return (
                <div key={facility.id || index} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image 
                      src={facility.image} 
                      alt={facility.name || "Facility Image"} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-indigo-600 uppercase tracking-widest rounded-full shadow-sm">
                        {getFacilityTypeLabel(facility.type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{facility.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">{facility.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-sm font-bold text-indigo-600">
                        {displayPrice}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openModal(facility)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(facility.id, facility.name)}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, facilities.length + 1)}</span> of <span className="font-bold text-gray-900">{facilities.length + 1}</span> items
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
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] my-8 relative">
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentFacility?.id ? "Edit Facility" : "Add Facility"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isUploading}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div 
                className={cn(
                  "relative h-48 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-300 transition-all",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                ) : currentFacility?.image ? (
                  <>
                    <Image src={currentFacility.image} fill sizes="(max-width: 768px) 100vw, 500px" alt={currentFacility.name || "Facility"} className="object-cover" />
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

              {/* Facility Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Facility Gallery</label>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {isUploadingGallery ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                    Add Images
                  </button>
                </div>
                {currentFacility?.gallery && currentFacility.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentFacility.gallery.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <Image src={img} fill alt={`Gallery ${idx}`} className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500">No gallery images added yet.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Facility Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Guest House"
                    value={currentFacility?.name || ""}
                    onChange={(e) => setCurrentFacility({ ...currentFacility, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Facility Type</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentFacility?.type || "simple"}
                    onChange={(e) => {
                      const newType = e.target.value as FacilityType;
                      setCurrentFacility({ 
                        ...currentFacility, 
                        type: newType,
                        rooms: newType === 'accommodation' ? currentFacility?.rooms || [] : [],
                        pricing: newType === 'event' ? currentFacility?.pricing || [] : []
                      });
                    }}
                  >
                    <option value="simple">Simple Facility (e.g. Library)</option>
                    <option value="accommodation">Accommodation (e.g. Guest House)</option>
                    <option value="event">Event Space (e.g. Auditorium)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">General Description</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="Describe the facility generally..."
                  value={currentFacility?.description || ""}
                  onChange={(e) => setCurrentFacility({ ...currentFacility, description: e.target.value })}
                />
              </div>

              {/* Dynamic Sections Based on Type */}
              {currentFacility?.type === 'accommodation' && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Rooms Configuration</h3>
                    <button 
                      onClick={addRoom}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Room
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {currentFacility.rooms?.map((room, index) => (
                      <div key={room.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                        <button 
                          onClick={() => removeRoom(room.id)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                        <h4 className="font-bold text-gray-700 mb-3 text-sm">Room {index + 1}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Room Name</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="e.g. Double Bed AC Room"
                              value={room.name || ""}
                              onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Price (₹)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="0"
                              value={room.price || ""}
                              onChange={(e) => updateRoom(room.id, 'price', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-600">Description</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Brief room description"
                              value={room.description || ""}
                              onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-600">Inclusions</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="e.g. Free Breakfast, WiFi"
                              value={room.inclusions || ""}
                              onChange={(e) => updateRoom(room.id, 'inclusions', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Check-in Time</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="e.g. 12:00 PM"
                              value={room.checkIn || ""}
                              onChange={(e) => updateRoom(room.id, 'checkIn', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600">Check-out Time</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="e.g. 11:00 AM"
                              value={room.checkOut || ""}
                              onChange={(e) => updateRoom(room.id, 'checkOut', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-600">Booking Policy (Optional)</label>
                            <textarea 
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-16"
                              placeholder="Any specific policy for this room..."
                              value={room.bookingPolicy || ""}
                              onChange={(e) => updateRoom(room.id, 'bookingPolicy', e.target.value)}
                            />
                          </div>
                          
                          {/* Room Images */}
                          <div className="space-y-2 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-gray-600">Room Images</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentRoomForUpload(room.id);
                                  roomImageInputRef.current?.click();
                                }}
                                disabled={uploadingRoomId === room.id}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                {uploadingRoomId === room.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                                Upload Room Images
                              </button>
                            </div>
                            {room.images && room.images.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {room.images.map((img, idx) => (
                                  <div key={idx} className="relative group aspect-video rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                                    <Image src={img} fill alt={`Room ${room.name} image ${idx}`} className="object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => removeRoomImage(room.id, idx)}
                                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-md">
                                No images uploaded for this room.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!currentFacility.rooms || currentFacility.rooms.length === 0) && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No rooms added yet. Click "Add Room" to get started.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentFacility?.type === 'event' && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Pricing Slots</h3>
                    <button 
                      onClick={addPricingSlot}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {currentFacility.pricing?.map((slot, index) => (
                      <div key={slot.id} className="flex gap-4 items-start p-3 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-semibold text-gray-600">Duration / Slot Type</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Day Time (09 AM to 04 PM)"
                            value={slot.duration || ""}
                            onChange={(e) => updatePricingSlot(slot.id, 'duration', e.target.value)}
                          />
                        </div>
                        <div className="w-1/3 space-y-1">
                          <label className="text-xs font-semibold text-gray-600">Amount (₹)</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="0"
                            value={slot.amount || ""}
                            onChange={(e) => updatePricingSlot(slot.id, 'amount', Number(e.target.value))}
                          />
                        </div>
                        <button 
                          onClick={() => removePricingSlot(slot.id)}
                          className="mt-6 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    {(!currentFacility.pricing || currentFacility.pricing.length === 0) && (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No pricing slots added yet.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Booking Policy</label>
                      <textarea 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                        placeholder="General booking policy for this space..."
                        value={currentFacility?.bookingPolicy || ""}
                        onChange={(e) => setCurrentFacility({ ...currentFacility, bookingPolicy: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Remarks / Extra Charges</label>
                      <textarea 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                        placeholder="e.g. Cleaning charges ₹1000 extra..."
                        value={currentFacility?.remarks || ""}
                        onChange={(e) => setCurrentFacility({ ...currentFacility, remarks: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
            <div className="sticky bottom-0 z-10 px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isUploading || isSaving}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                Cancel
              </button>
              <button 
                onClick={saveFacility}
                disabled={isUploading || isSaving || isUploadingGallery || uploadingRoomId !== null}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center"
              >
                {isSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                {currentFacility?.id ? "Update Facility" : "Save Facility"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
