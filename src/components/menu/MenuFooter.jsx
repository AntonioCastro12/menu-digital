import React from 'react';
import { Lock, Utensils } from 'lucide-react';

export default function MenuFooter({ settings, onOpenAdmin }) {
  const currentYear = new Date().getFullYear();
  const name = settings?.name || 'Menú Digital';

  return (
    <footer className="mt-16 bg-white border-t border-stone-200/80 py-10 px-4 text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
          <Utensils className="w-5 h-5" />
        </div>

        <h3 className="font-bold text-stone-900 text-base">{name}</h3>
        {settings?.tagline && (
          <p className="text-xs text-stone-500 mt-0.5 max-w-sm">{settings.tagline}</p>
        )}

        {/* Social Links */}
        {(settings?.socialInstagram || settings?.socialFacebook) && (
          <div className="flex items-center gap-4 mt-4">
            {settings?.socialInstagram && (
              <a
                href={`https://instagram.com/${settings.socialInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-pink-600 transition p-2 rounded-full hover:bg-pink-50"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {settings?.socialFacebook && (
              <a
                href={`https://facebook.com/${settings.socialFacebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-stone-400 mt-6">
          © {currentYear} {name}. Todos los derechos reservados.
        </p>

        {/* Discreet Admin Link */}
        <div className="mt-8 pt-4 border-t border-stone-100 w-full flex justify-center">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 font-medium py-1.5 px-3 rounded-lg hover:bg-stone-100 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Administrar menú</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
