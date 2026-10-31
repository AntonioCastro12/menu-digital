import React from 'react';
import { LayoutDashboard, UtensilsCrossed, FolderTree, Settings, ExternalLink, LogOut, Shield } from 'lucide-react';

export default function AdminNavbar({ activeTab, onSelectTab, onViewPublic, onLogout, restaurantName }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: UtensilsCrossed },
    { id: 'categories', label: 'Categorías', icon: FolderTree },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <nav className="bg-stone-900 text-white sticky top-0 z-40 shadow-lg border-b border-stone-800">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight">Panel Administrativo</h1>
            <p className="text-[11px] text-stone-400 truncate max-w-[180px] sm:max-w-xs">
              {restaurantName || 'Mi Restaurante'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Public Menu Button */}
          <button
            type="button"
            onClick={onViewPublic}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver menú</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/40 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-stone-800/60 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
