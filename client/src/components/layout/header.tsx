import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PromoveLogo } from '@/lib/promove-logo';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    console.log("Botão de logout clicado");
    try {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          console.log("Logout realizado, redirecionando...");
          // O redirecionamento agora é feito diretamente pelo useAuth
          // Não precisamos usar navigate aqui
        }
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      window.location.href = '/auth'; // Fallback para garantir redirecionamento
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <PromoveLogo height={40} />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-gray-100 focus:outline-none relative">
                <Bell className="h-5 w-5" />
                {/* Indicador de notificação - comentado por enquanto */}
                {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-4 text-center text-sm text-gray-500">
                Não há notificações no momento
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Botão de logout */}
          <button 
            onClick={handleLogout}
            className="hidden md:flex items-center space-x-1 p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 focus:outline-none"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sair</span>
          </button>
          
          {/* Perfil do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-white">
                    {user?.nome ? getInitials(user.nome) : "??"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">
                  {user?.nome || "Usuário"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Meu perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
