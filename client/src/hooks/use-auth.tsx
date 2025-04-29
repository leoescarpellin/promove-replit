import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<Response, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Consulta para obter o usuário atual
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, "password"> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Mutação para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Enviando credenciais para login:", credentials);
      const res = await apiRequest("POST", "/api/login", credentials);
      const userData = await res.json();
      console.log("Resposta de login recebida:", userData);
      return userData;
    },
    onSuccess: (userData: Omit<User, "password">) => {
      console.log("Atualizando estado de usuário após login:", userData);
      // Definir explicitamente os dados do usuário no cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Invalidar a consulta para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userData.nome}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Erro no login:", error);
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Enviando requisição de logout...");
      const res = await apiRequest("POST", "/api/logout");
      console.log("Resposta de logout:", res.status);
      return res;
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido, limpando dados do usuário...");
      // Limpar o cache do usuário
      queryClient.setQueryData(["/api/user"], null);
      
      // Invalidar a consulta de usuário para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Até logo!",
      });
      
      // Forçar uma atualização da página para garantir o redirecionamento
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      console.error("Erro no logout:", error);
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
