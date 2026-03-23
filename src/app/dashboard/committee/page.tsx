"use client";

import React, { useState, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Camera, 
  User, 
  Mail, 
  Phone,
  X,
  Linkedin,
  Twitter,
  ExternalLink,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Member {
  id: string;
  name: string;
  role: string;
  image: string | null;
  email: string;
}

const initialMembers: Member[] = [
  { id: "1", name: "Dr. Arun Kumar", role: "President", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", email: "president@assamassociation.delhi" },
  { id: "2", name: "Mrs. Reema Saikia", role: "Vice President", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", email: "vp@assamassociation.delhi" },
  { id: "3", name: "Mr. Rajat Baruah", role: "General Secretary", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", email: "gs@assamassociation.delhi" },
  { id: "4", name: "Mr. Diganta Bora", role: "Treasurer", image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", email: "treasurer@assamassociation.delhi" },
];

export default function CommitteePage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this committee member?")) {
      setMembers(members.filter(m => m.id !== id));
      toast.success("Member removed successfully");
    }
  };

  const openModal = (member: Member | null = null) => {
    setCurrentMember(member || { id: "", name: "", role: "", email: "", image: null });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Member, value: string) => {
    if (currentMember) {
      setCurrentMember({ ...currentMember, [field]: value });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading and optimizing image...");
      
      const imageUrl = await uploadToCloudinary(file);
      
      if (currentMember) {
        setCurrentMember({ ...currentMember, image: imageUrl });
      }
      
      toast.success("Image uploaded and optimized!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image. Check Cloudinary config in .env.local");
    } finally {
      setIsUploading(false);
    }
  };

  const saveMember = () => {
    if (!currentMember?.name || !currentMember?.role) {
      toast.error("Name and Role are required");
      return;
    }

    if (currentMember.id) {
      setMembers(members.map(m => m.id === currentMember.id ? currentMember : m));
      toast.success("Member updated successfully");
    } else {
      const newMember = { ...currentMember, id: Date.now().toString() };
      setMembers([...members, newMember]);
      toast.success("Member added successfully");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the executive committee members and their profiles.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </button>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload}
      />

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member) => (
          <div key={member.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-6 text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-indigo-50 shadow-inner mx-auto mb-4 relative">
                  {member.image ? (
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User size={40} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => openModal(member)}
                  className="absolute bottom-4 right-0 p-1.5 bg-white rounded-full text-indigo-600 shadow-md border border-gray-100 hover:scale-110 transition-transform z-10"
                >
                  <Camera size={14} />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-gray-1000 mb-1">{member.name}</h3>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{member.role}</p>
              
              <div className="mt-4 flex items-center justify-center space-x-3 text-gray-400">
                <button className="hover:text-indigo-600 transition-colors"><Mail size={18} /></button>
                <button className="hover:text-indigo-600 transition-colors"><Linkedin size={18} /></button>
                <button className="hover:text-indigo-600 transition-colors"><Twitter size={18} /></button>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center space-x-4">
              <button 
                onClick={() => openModal(member)}
                className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center transition-colors px-2 py-1 rounded-md hover:bg-indigo-50"
              >
                <Edit2 size={12} className="mr-1" />
                Edit Profile
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button 
                onClick={() => handleDelete(member.id)}
                className="text-xs font-bold text-gray-600 hover:text-red-600 flex items-center transition-colors px-2 py-1 rounded-md hover:bg-red-50"
              >
                <Trash2 size={12} className="mr-1" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Add Card */}
        <button 
          onClick={() => openModal()}
          className="flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group"
        >
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Add Committee Member</span>
        </button>
      </div>

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentMember?.id ? "Edit Member" : "Add Member"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center pb-4">
                <div 
                  className={cn(
                    "h-24 w-24 rounded-full bg-gray-100 border-2 border-indigo-100 flex items-center justify-center text-gray-400 mb-2 relative overflow-hidden cursor-pointer hover:border-indigo-300 transition-all",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-indigo-600" />
                  ) : currentMember?.image ? (
                    <Image src={currentMember.image} fill alt="Member" className="object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">{isUploading ? "Uploading..." : "Click to upload/change photo"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter name"
                    value={currentMember?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Role</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. President"
                    value={currentMember?.role || ""}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="name@example.com"
                  value={currentMember?.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                onClick={saveMember}
                disabled={isUploading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {currentMember?.id ? "Save Changes" : "Save Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
