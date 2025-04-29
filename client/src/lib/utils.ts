import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata data no padrão brasileiro
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
}

// Formata data e hora no padrão brasileiro
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

// Calcula a idade a partir da data de nascimento
export function calcularIdade(dataNascimento: Date | string | null | undefined): number {
  if (!dataNascimento) return 0;
  
  const dateObj = typeof dataNascimento === "string" ? new Date(dataNascimento) : dataNascimento;
  return differenceInYears(new Date(), dateObj);
}

// Formata valor monetário
export function formatarValor(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  
  const numeroValor = typeof valor === "string" ? parseFloat(valor) : valor;
  
  return numeroValor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Converte string ISO para Date (útil para formulários)
export function parseISO(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr);
}

// Extrai as iniciais de um nome
export function getInitials(name: string): string {
  if (!name) return "";
  
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
