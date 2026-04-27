import React from 'react';
import { motion } from 'motion/react';
import Sidebar from '../controls/Sidebar';
import { RefreshCw, Download, Copy, BookmarkPlus, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useBlobContext } from '../../context/BlobContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { randomize, saveBlob, user, login, signout, authLoading } = useBlobContext();

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-night-900 text-white overflow-hidden">
      {/* Sidebar - Controles */}
      <Sidebar />

      {/* Main Canvas Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {/* User Profile / Login (Top Right) */}
        <div className="absolute top-8 right-8 z-30">
          {authLoading ? (
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4 glass p-1.5 pr-4 rounded-full group">
              <img 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'} 
                className="w-8 h-8 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">
                {user.displayName?.split(' ')[0]}
              </span>
              <button 
                onClick={signout}
                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-all"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 rounded-full transition-all text-sm font-medium"
            >
              <LogIn size={16} />
              <span>Entrar com Google</span>
            </button>
          )}
        </div>

        {/* Floating Action Group (Bottom) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 glass p-2 rounded-2xl z-30">
          <button 
            onClick={randomize}
            className="p-3 hover:bg-white/10 rounded-xl transition-all group" 
            title="Randomize"
          >
            <RefreshCw size={20} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          
          <button 
            onClick={saveBlob}
            className="p-3 hover:bg-white/10 text-yellow-500 rounded-xl transition-all" 
            title="Salvar na Galeria"
          >
            <BookmarkPlus size={20} />
          </button>

          <button className="p-3 hover:bg-white/10 rounded-xl transition-all" title="Copy SVG">
            <Copy size={20} />
          </button>
          
          <button className="px-6 py-3 bg-blob-blue hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blob-blue/20 flex items-center gap-2">
            <Download size={18} />
            <span>Export SVG</span>
          </button>
        </div>

        {/* Render Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl aspect-square flex items-center justify-center relative"
        >
          {children}
        </motion.div>

        {/* Footer */}
        <footer className="absolute bottom-6 right-8 z-30">
          <a 
            href="https://www.linkedin.com/in/geovanna-costa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col items-end gap-1"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 group-hover:text-blob-blue transition-colors">
              Siga no Linkedin
            </span>
            <span className="text-sm font-black uppercase tracking-tighter text-white group-hover:scale-105 transition-transform origin-right">
              GEOVANNA COSTA
            </span>
            <div className="h-0.5 w-8 bg-blob-blue rounded-full group-hover:w-full transition-all duration-300" />
          </a>
        </footer>
      </main>
    </div>
  );
}
