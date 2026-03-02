import { Home, PlusSquare, LayoutDashboard, MessageCircle, Grid } from 'lucide-react';

interface NavigationProps {
  currentStep: string;
  onNavigate: (step: any) => void;
  unreadCount?: number;
}

export default function Navigation({ currentStep, onNavigate, unreadCount = 0 }: NavigationProps) {
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'details', label: 'Create', icon: PlusSquare },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Grid },
    { id: 'support', label: 'Support', icon: MessageCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 px-6 py-3 md:hidden z-50 transition-colors">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentStep === item.id || (item.id === 'create' && (currentStep === 'topic-selection' || currentStep === 'details'));
          
          return (
            <button
              key={item.id}
              id={`${item.id}-nav`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 transition-colors relative ${
                isActive ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                {item.id === 'dashboard' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
