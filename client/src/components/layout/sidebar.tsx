import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Users, CalendarClock, User, FileText, Calendar, 
  PieChart, Settings, CheckSquare, Menu, X 
} from 'lucide-react';

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };
  
  return (
    <>
      {/* Botão para abrir o menu mobile */}
      <button 
        onClick={() => setMobileOpen(true)} 
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>
      
      {/* Overlay para fechar o menu no mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      <aside 
        className={cn(
          "bg-white w-64 border-r border-gray-200 fixed h-full md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Botão de fechar no mobile */}
          <div className="flex justify-between items-center mb-6 md:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button 
              onClick={closeMobileSidebar}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="space-y-1 flex-1">
            <Link href="/">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <LayoutDashboard size={20} />
                <span>Painel</span>
              </a>
            </Link>
            
            <div className="px-3 py-2 text-xs uppercase text-gray-500 font-semibold mt-4">
              Gerenciamento
            </div>
            
            <Link href="/atendimentos">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/atendimentos" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <CalendarClock size={20} />
                <span>Atendimentos</span>
              </a>
            </Link>
            
            <Link href="/pacientes">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/pacientes" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <User size={20} />
                <span>Clientes</span>
              </a>
            </Link>
            
            <Link href="/usuarios">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/usuarios" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <Users size={20} />
                <span>Usuários</span>
              </a>
            </Link>
            
            <Link href="/tipos-atendimento">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/tipos-atendimento" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <CheckSquare size={20} />
                <span>Tipos de Atendimento</span>
              </a>
            </Link>
            
            <div className="px-3 py-2 text-xs uppercase text-gray-500 font-semibold mt-4">
              Visualização
            </div>
            
            <Link href="/calendario">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/calendario" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <Calendar size={20} />
                <span>Calendário</span>
              </a>
            </Link>
            
            <Link href="/relatorios">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/relatorios" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <PieChart size={20} />
                <span>Relatórios</span>
              </a>
            </Link>
            
            <div className="px-3 py-2 text-xs uppercase text-gray-500 font-semibold mt-4">
              Sistema
            </div>
            
            <Link href="/configuracoes">
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  location === "/configuracoes" 
                    ? "bg-primary text-black"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={closeMobileSidebar}
              >
                <Settings size={20} />
                <span>Configurações</span>
              </a>
            </Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="px-3 py-2 rounded-md bg-primary-light">
              <div className="text-sm font-medium">Promove ABA</div>
              <div className="text-xs text-gray-500">Versão 1.0.0</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
