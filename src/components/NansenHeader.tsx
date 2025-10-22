import nansenLogo from '@/assets/logo-nansen.png';

export const NansenHeader = () => {
  return (
    <header className="relative border-b border-primary/20 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img 
            src={nansenLogo} 
            alt="Nansen Logo" 
            className="h-17 w-auto shadow-lg shadow-primary/20" 
          />
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">
            A ENERGIA QUE MOVE O BRASIL<br />
            PASSA PELA NOSSA TECNOLOGIA
          </p>
        </div>
      </div>
      
      {/* Efeito de brilho sutil */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </header>
  );
};
