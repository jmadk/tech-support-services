import React from 'react';
import { SUPPORT_WHATSAPP_MESSAGE, SUPPORT_WHATSAPP_NUMBER } from '@/lib/site-config';

const FloatingWhatsApp: React.FC = () => {
  const whatsappNumber = SUPPORT_WHATSAPP_NUMBER.replace(/\D/g, '').replace(/^0/, '254');
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;
  const socialLinkClass = 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 sm:h-11 sm:w-11';

  return (
    <div className="fixed bottom-5 right-3 z-50 flex items-center gap-2 sm:bottom-6 sm:right-6 sm:gap-2.5">
      <a
        href="https://x.com/KeithChege63546"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow KCJ Tech on X"
        title="X"
        className={`${socialLinkClass} border-white/15 bg-[#111827]/95 hover:border-cyan-300/60 hover:bg-black`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true">
          <path fill="currentColor" d="M18.9 1.15h3.68L14.54 10.98 24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.59-9.83L0 1.15h7.59l5.25 6.93zM17.61 20.76h2.04L6.48 3.13H4.29z" />
        </svg>
      </a>

      <a
        href="https://www.instagram.com/keith.chege/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow KCJ Tech on Instagram"
        title="Instagram"
        className={`${socialLinkClass} border-pink-400/40 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:brightness-110`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="6" r="1" fill="currentColor" />
        </svg>
      </a>

      <a
        href="https://www.facebook.com/keith.chege.5"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow KCJ Tech on Facebook"
        title="Facebook"
        className={`${socialLinkClass} border-[#1877f2] bg-[#1877f2] hover:bg-[#1466d5]`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden="true">
          <path fill="currentColor" d="M13.2 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.6 1.6-1.6h1.7V3.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.2V13H10v8z" />
        </svg>
      </a>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white shadow-2xl shadow-emerald-900/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1ebe5d] hover:shadow-emerald-700/35 focus:outline-none focus:ring-4 focus:ring-emerald-300/60 sm:min-h-14 sm:gap-3 sm:px-5 sm:py-3"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 sm:h-9 sm:w-9">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="h-5 w-5 sm:h-6 sm:w-6"
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
    </div>
  );
};

export default FloatingWhatsApp;