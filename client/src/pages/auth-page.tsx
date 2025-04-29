import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@shared/schema";
import { PromoveLogo } from "@/lib/promove-logo";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirecionar para o dashboard se o usuário já estiver logado
  if (user) {
    navigate("/");
    return null;
  }

  // Form para login
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Função para fazer login
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    console.log("Tentando fazer login...");
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        console.log("Login bem-sucedido, redirecionando...", userData);
        // Em vez de usar navigate do wouter, usamos window.location para um redirecionamento mais forte
        window.location.href = "/";
      },
      onError: (error) => {
        console.error("Erro no login:", error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-primary-light">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mx-auto mb-4">
            <PromoveLogo height={60} />
          </div>
          <CardTitle className="text-2xl font-poppins text-center">Bem-vindo ao Promove</CardTitle>
          <CardDescription className="text-center">Sistema de Atendimento ABA</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome de usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {loginMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent-dark"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Novos usuários devem ser cadastrados por um administrador do sistema.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <p className="text-xs text-center w-full text-gray-500">
            © {new Date().getFullYear()} Grupo Promove. Todos os direitos reservados.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}