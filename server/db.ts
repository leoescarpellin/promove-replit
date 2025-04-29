import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para o Neon Database (se estiver usando)
neonConfig.webSocketConstructor = ws;

// Verificar se a URL do banco de dados está configurada
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve estar configurada. Você esqueceu de provisionar um banco de dados?"
  );
}

// Criar o pool de conexões
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Criar a instância do Drizzle para interagir com o banco de dados
export const db = drizzle(pool, { schema });