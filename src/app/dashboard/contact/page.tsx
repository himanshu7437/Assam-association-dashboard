"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  User, 
  Clock, 
  Mail, 
  Phone,
  Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  getContacts, 
  deleteDashboardItem, 
  ContactSubmission 
} from "@/lib/api/dashboard";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ContactMessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setMessages(data);
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDashboardItem("contacts", id);
        setMessages(messages.filter(msg => msg.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
        toast.success("Message deleted");
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const filteredMessages = messages.filter(msg => 
    (msg.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (msg.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-500 text-sm mt-1">Read and manage messages received through the official contact form.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex divide-x divide-gray-100 font-sans">
        {/* Messages List Area */}
        <div className="w-full md:w-1/3 flex flex-col min-w-[320px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No messages found</div>
            ) : filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                onClick={() => setSelectedMessage(msg)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 border-l-4",
                  selectedMessage?.id === msg.id ? "bg-indigo-50/50 border-indigo-600" : "border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold truncate pr-2 text-gray-900 flex items-center">
                    {msg.fullName}
                    {msg.status === 'new' && (
                      <span className="ml-2 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" title="New message"></span>
                    )}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap uppercase tracking-wider">{formatTime(msg.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-700 truncate">{msg.subject || "No Subject"}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Message Content Area */}
        <div className="hidden md:flex flex-1 flex-col bg-gray-50/30">
          {selectedMessage ? (
            <>
              <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm">
                    {selectedMessage.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedMessage.fullName}</h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center"><Mail size={12} className="mr-1" /> {selectedMessage.email}</span>
                      {selectedMessage.phone && (
                        <span className="flex items-center"><Phone size={12} className="mr-1" /> {selectedMessage.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm" 
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject || "No Subject"}</h2>
                    <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                      <Clock size={12} className="mr-1.5" />
                      Received on {formatTime(selectedMessage.createdAt)}
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <p className="text-xs text-gray-400 italic">This message was submitted via the Contact Us form on the website.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
              <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                <MessageSquare size={48} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-2">No Message Selected</h3>
              <p className="text-sm text-center mt-1">Select a message from the list to read its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
