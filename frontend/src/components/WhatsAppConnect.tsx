import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function WhatsAppConnect() {
  const [copied, setCopied] = useState(false);
  const phoneNumber = '+1 415 523 8886';
  const joinCode = 'join break-additional';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://wa.me/14155238886?text=${encodeURIComponent(joinCode)}`;
  const whatsappLink = `https://wa.me/14155238886?text=${encodeURIComponent(joinCode)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section 
      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 sm:p-12 border-2 border-green-200 animate-fade-in"
      aria-labelledby="whatsapp-heading"
    >
      <div className="max-w-6xl mx-auto">
        <h2 id="whatsapp-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center">
          Connect to WhatsApp Sandbox
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
          To begin testing, connect to Twilio sandbox by sending a WhatsApp message from your device to the Twilio number.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Instructions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-green-100 hover:border-green-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Send a WhatsApp Message</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4">Use WhatsApp and send a message from your device to:</p>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between gap-2">
                    <a 
                      href={whatsappLink}
                      className="text-green-600 font-semibold hover:text-green-700 flex-1 flex items-center gap-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {phoneNumber}
                    </a>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base mt-4">with code:</p>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-3 flex items-center justify-between gap-2">
                    <code className="text-green-600 font-semibold text-sm sm:text-base">{joinCode}</code>
                    <button
                      onClick={handleCopyCode}
                      className="text-green-600 hover:text-green-700 transition-colors p-2 hover:bg-white rounded-lg"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-green-100 hover:border-green-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Wait for Activation</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Once you send the message, you'll be added to the sandbox. Valid for 72 hours. You can rejoin anytime by sending a new message.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 sm:p-8 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                What You Can Do Next
              </h4>
              <ul className="text-blue-800 text-sm sm:text-base space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                  ✅ Payment confirmations
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                  📍 Feedback updates
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                  🚌 Occupancy alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                  💬 Direct support chats
                </li>
              </ul>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-200 mb-6">
              <p className="text-center text-gray-600 text-sm font-medium mb-6 uppercase tracking-wider">Scan on Mobile</p>
              <img 
                src={qrCodeUrl}
                alt="WhatsApp Sandbox QR Code"
                className="w-72 h-72 max-w-full mx-auto border-4 border-gray-100 rounded-2xl"
              />
              <p className="text-center text-gray-600 text-xs sm:text-sm mt-6">
                Scan with your phone camera or WhatsApp app
              </p>
            </div>

            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all group"
              >
                <MessageCircle className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Open WhatsApp
                <svg className="h-6 w-6 ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </a>

            <p className="text-center text-gray-500 text-xs sm:text-sm mt-4">
              By sending a message, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
