interface LogoutOverlayProps {
  visible: boolean;
}

export const LogoutOverlay = ({ visible }: LogoutOverlayProps) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-timia-black/95 backdrop-blur-sm animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-timia-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-timia-blue/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <img
          src="/logo_timia_white.svg"
          alt="TIMIA"
          width={120}
          height={24}
          className="opacity-80"
        />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-timia-accent" />
        <p className="text-sm font-medium text-gray-300 tracking-wide">
          Cerrando sesión...
        </p>
      </div>
    </div>
  );
};
