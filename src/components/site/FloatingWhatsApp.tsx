import React from 'react';
import { SUPPORT_WHATSAPP_MESSAGE, SUPPORT_WHATSAPP_NUMBER } from '@/lib/site-config';

const FloatingWhatsApp: React.FC = () => {
  const whatsappNumber = SUPPORT_WHATSAPP_NUMBER.replace(/\D/g, '').replace(/^0/, '254');
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-4 z-50 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-900/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1ebe5d] hover:shadow-emerald-700/35 focus:outline-none focus:ring-4 focus:ring-emerald-300/60 sm:bottom-6 sm:right-6 sm:px-5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M16.02 5.33a10.58 10.58 0 0 0-9.06 16.02L5.6 26.67l5.46-1.3A10.58 10.58 0 1 0 16.02 5.33Zm0 2.12a8.46 8.46 0 0 1 7.18 12.95 8.48 8.48 0 0 1-10.9 2.88l-.38-.2-3.05.72.76-2.95-.24-.4A8.46 8.46 0 0 1 16.02 7.45Zm-3.03 4.17c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.91 1.23 3.12c.15.2 2.1 3.35 5.2 4.56 2.57 1 3.1.8 3.66.75.56-.05 1.8-.73 2.05-1.44.26-.7.26-1.3.18-1.44-.08-.13-.28-.2-.59-.36-.3-.15-1.8-.9-2.08-1-.28-.1-.49-.15-.69.16-.2.3-.8 1-.98 1.2-.18.2-.36.23-.67.08-.3-.15-1.28-.47-2.45-1.5-.9-.8-1.52-1.8-1.7-2.1-.18-.3-.02-.47.13-.62.14-.13.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.39-.03-.54-.08-.15-.7-1.7-.96-2.32-.25-.6-.5-.52-.7-.53h-.51Z"
          />
        </svg>
      </span>
      <span className="whitespace-nowrap leading-none">Chat with us</span>
    </a>
  );
};

export default FloatingWhatsApp;
