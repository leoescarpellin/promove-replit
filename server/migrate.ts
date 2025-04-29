import { pool } from './db';
import * as schema from '../shared/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

// Esta função executa as migrações do banco de dados
async function runMigrations() {
  console.log('Iniciando migrações do banco de dados...');
  
  // Criar um pool de conexão temporário
  const db = drizzle(pool, { schema });
  
  try {
    // Criar tabelas de forma programática usando SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        profissao TEXT,
        endereco TEXT,
        data_nascimento DATE,
        pix TEXT,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tipos_atendimento (
        id SERIAL PRIMARY KEY,
        sigla TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL,
        descricao TEXT,
        valor DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS usuario_tipos_atendimento (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES users(id),
        tipo_atendimento_id INTEGER NOT NULL REFERENCES tipos_atendimento(id),
        valor DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS criancas (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        endereco TEXT,
        data_nascimento DATE,
        pai TEXT,
        mae TEXT,
        email TEXT,
        telefone TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crianca_tipos_atendimento (
        id SERIAL PRIMARY KEY,
        crianca_id INTEGER NOT NULL REFERENCES criancas(id),
        tipo_atendimento_id INTEGER NOT NULL REFERENCES tipos_atendimento(id),
        valor DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS atendimentos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES users(id),
        crianca_id INTEGER NOT NULL REFERENCES criancas(id),
        tipo_atendimento_id INTEGER NOT NULL REFERENCES tipos_atendimento(id),
        data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
        data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
        descricao TEXT,
        valor DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS session (
        sid TEXT PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    
    console.log('Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  } finally {
    // Fechar as conexões
    await pool.end();
  }
}

// Executar migrações
runMigrations()
  .then(() => {
    console.log('Processo de migração finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Falha no processo de migração:', err);
    process.exit(1);
  });