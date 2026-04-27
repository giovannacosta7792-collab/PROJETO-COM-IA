@import "tailwindcss";

@theme {
  --color-night-900: #020617;
  --color-night-800: #0f172a;
  --color-night-700: #1e293b;
  --color-blob-blue: #3b82f6;
}

body {
  @apply bg-night-900 text-slate-100 antialiased overflow-hidden;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 40%);
}

/* Glassmorphism Core */
.glass {
  @apply bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl;
}

.glass-hover {
  @apply hover:bg-white/[0.06] transition-all duration-300;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  @apply bg-transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-white/10 rounded-full hover:bg-white/20;
}
