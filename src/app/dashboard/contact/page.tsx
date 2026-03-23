"use client";

import React, { useState } from "react";
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  User, 
  Clock, 
  Mail, 
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  sender: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  time: string;
  read: boolean;
}

const initialMessages: Message[] = [
  { id: "1", sender: "Rahul Sharma", email: "rahul@example.com", phone: "+91 9876543210", subject: "Query regarding Bhawan Booking", message: "Hello, I wanted to know if the Bhawan Hall is available on 15th April for a cultural event. Please let me know the charges.", time: "2 hours ago", read: false },
  { id: "2", sender: "Sunita Gogoi", email: "sunita@example.com", phone: "+91 8877665544", subject: "Membership Renewal", message: "I am unable to find the link for membership renewal on the website. Can you please guide me?", time: "5 hours ago", read: true },
  { id: "3", sender: "Bikash Das", email: "bikash@example.com", phone: "+91 7766554433", subject: "Donation Confirmation", message: "I localted a donation of 5000 INR yesterday. Attached is the screenshot of the transaction.", time: "Yesterday", read: true },
  { id: "4", sender: "Meenakshi Baruah", email: "meenakshi@example.com", phone: "+91 6655443322", subject: "Guest House Availability", message: "Looking for 2 rooms in the Guest House from 20th to 25th March. Please confirm availability.", time: "2 days ago", read: true },
];

export default function ContactMessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const filteredMessages = messages.filter(msg => 
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                onClick={() => setSelectedMessage(msg)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 border-l-4",
                  selectedMessage?.id === msg.id ? "bg-indigo-50/50 border-indigo-600" : "border-transparent",
                  !msg.read && "bg-blue-50/30"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={cn("text-sm font-bold truncate pr-2", !msg.read ? "text-indigo-900" : "text-gray-900")}>
                    {msg.sender}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap uppercase tracking-wider">{msg.time}</span>
                </div>
                <p className="text-xs font-bold text-gray-700 truncate">{msg.subject}</p>
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
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedMessage.sender}</h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center"><Mail size={12} className="mr-1" /> {selectedMessage.email}</span>
                      <span className="flex items-center"><Phone size={12} className="mr-1" /> {selectedMessage.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100 shadow-sm" title="Mark as Read">
                    <CheckCircle2 size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 shadow-sm" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                    <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                      <Clock size={12} className="mr-1.5" />
                      Received on {selectedMessage.time}
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
