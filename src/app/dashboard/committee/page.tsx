"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Member {
  id?: string;
  fullName: string;
  role: string;
  image: string | null;
  email: string;
}

const ITEMS_PER_PAGE = 7; // 7 members + 1 add card = 8 total per view

export default function CommitteePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "committee"));
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      
      // Sort by fullName
      membersList.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching committee members:", error);
      toast.error("Failed to load committee members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this committee member?")) {
      try {
        await deleteDoc(doc(db, "committee", id));
        setMembers(members.filter(m => m.id !== id));
        toast.success("Member removed successfully");
      } catch (error) {
        console.error("Error deleting member:", error);
        toast.error("Failed to delete member");
      }
    }
  };

  const openModal = (member: Member | null = null) => {
    setCurrentMember(member || { fullName: "", role: "", email: "", image: null });
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
      toast.error(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveMember = async () => {
    if (!currentMember?.fullName || !currentMember?.role) {
      toast.error("Name and Role are required");
      return;
    }

    try {
      if (currentMember.id) {
        // Update existing member
        const memberRef = doc(db, "committee", currentMember.id);
        const { id, ...updateData } = currentMember as Member;
        await updateDoc(memberRef, updateData as any);
        toast.success("Member updated successfully");
      } else {
        // Create new member
        await addDoc(collection(db, "committee"), currentMember);
        toast.success("Member added successfully");
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("Failed to save member");
    }
  };

  const totalPages = Math.ceil((members.length + 1) / ITEMS_PER_PAGE);
  const paginatedItems = () => {
    const blendedArray = [...members, "ADD_CARD" as const];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return blendedArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
            {paginatedItems().map((item, index) => {
              if (item === "ADD_CARD") {
                return (
                  <button 
                    key="add-card"
                    onClick={() => openModal()}
                    className="flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group"
                  >
                    <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 text-indigo-600">
                      <Plus size={24} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Add Committee Member</span>
                  </button>
                );
              }

              const member = item as Member;
              return (
                <div key={member.id || index} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="p-6 text-center">
                    <div className="relative inline-block">
                      <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-indigo-50 shadow-inner mx-auto mb-4 relative">
                        {member.image ? (
                          <Image src={member.image} alt={member.fullName} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User size={40} />
                          </div>
                        )}
                      </div>

                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{member.fullName}</h3>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{member.role}</p>
                    
                    {member.email && (
                      <div className="mt-4 flex items-center justify-center">
                        <a 
                          href={`mailto:${member.email}`}
                          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors text-xs font-medium"
                        >
                          <Mail size={14} className="mr-1.5" />
                          {member.email}
                        </a>
                      </div>
                    )}
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
                      onClick={() => handleDelete(member.id!)}
                      className="text-xs font-bold text-gray-600 hover:text-red-600 flex items-center transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                    >
                      <Trash2 size={12} className="mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm mt-8">
              <p className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, members.length + 1)}</span> of <span className="font-bold text-gray-900">{members.length + 1}</span> members
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentMember?.id ? "Edit Member" : "Add Member"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                disabled={isUploading}
              >
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
                    <Image src={currentMember.image} fill sizes="128px" alt="Member" className="object-cover" />
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
                    value={currentMember?.fullName || ""}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
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
                disabled={isUploading}
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
