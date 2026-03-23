"use client";

import React, { useState, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Camera, 
  X,
  Clock,
  ExternalLink,
  Save,
  Loader2,
  Upload
} from "lucide-react";
import Image from "next/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
}

const initialServices: Service[] = [
  { 
    id: "1", 
    name: "Srimanta Sankaradeva Bhawan Auditorium", 
    description: "Multi-purpose auditorium with 500+ seating capacity, fully air-conditioned with modern sound systems.", 
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800", 
    category: "Facility",
    price: "₹15,000 / day"
  },
  { 
    id: "2", 
    name: "Guest House Rooms", 
    description: "Comfortable accommodation for visitors with attached toilets, geysers, and meal services.", 
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800", 
    category: "Accommodation",
    price: "₹1,200 / night"
  },
  { 
    id: "3", 
    name: "Library & Research Center", 
    description: "Extensive collection of books on Assamese culture, history, and Sankaradeva's philosophy.", 
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800", 
    category: "Service"
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this service/facility entry?")) {
      setServices(services.filter(s => s.id !== id));
      toast.success("Entry removed");
    }
  };

  const openModal = (service: Service | null = null) => {
    setCurrentService(service || { name: "", description: "", image: "", category: "Facility" });
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

  const saveService = () => {
    if (!currentService?.name || !currentService?.image) {
      toast.error("Name and Image are required");
      return;
    }

    if (currentService.id) {
      setServices(services.map(s => s.id === currentService.id ? currentService as Service : s));
      toast.success("Service updated");
    } else {
      const newService = { ...currentService, id: Date.now().toString() } as Service;
      setServices([...services, newService]);
      toast.success("New service added");
    }
    setIsModalOpen(false);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative h-48 w-full bg-gray-100">
              <Image 
                src={service.image} 
                alt={service.name} 
                fill 
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
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Create Card */}
        <button 
          onClick={() => openModal()}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group min-h-[300px]"
        >
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
            <Plus size={32} />
          </div>
          <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Add Service / Facility</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentService?.id ? "Edit Facility" : "Add Facility"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
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
                    <Image src={currentService.image} fill alt="Service" className="object-cover" />
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
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
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
