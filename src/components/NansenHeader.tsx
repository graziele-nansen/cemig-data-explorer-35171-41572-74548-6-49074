import nansenLogo from '@/assets/logo-nansen.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const NansenHeader = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="relative border-b border-primary/20 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          
          <div className="flex flex-col items-center gap-3 text-center">
            <img 
              src={nansenLogo} 
              alt="Nansen Logo" 
              className="h-16 w-auto shadow-lg shadow-primary/20" 
            />
            <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase whitespace-pre-line">
              {t('header.tagline')}
            </p>
          </div>

          <div className="flex-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              {language === 'pt' ? 'EN' : 'PT'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Efeito de brilho sutil */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </header>
  );
};
