import { users, User, InsertUser, tiposAtendimento, TipoAtendimento, InsertTipoAtendimento, 
  criancas, Crianca, InsertCrianca, atendimentos, Atendimento, InsertAtendimento,
  usuarioTiposAtendimento, UsuarioTipoAtendimento, InsertUsuarioTipoAtendimento,
  criancaTiposAtendimento, CriancaTipoAtendimento, InsertCriancaTipoAtendimento } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { pool } from "./db";

// Tipo de store para sessão
type SessionStore = session.Store;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Tipo Atendimento related
  createTipoAtendimento(tipo: InsertTipoAtendimento): Promise<TipoAtendimento>;
  getTipoAtendimento(id: number): Promise<TipoAtendimento | undefined>;
  getTipoAtendimentoBySigla(sigla: string): Promise<TipoAtendimento | undefined>;
  updateTipoAtendimento(id: number, tipo: Partial<TipoAtendimento>): Promise<TipoAtendimento | undefined>;
  deleteTipoAtendimento(id: number): Promise<boolean>;
  getAllTiposAtendimento(): Promise<TipoAtendimento[]>;
  
  // Criança related
  createCrianca(crianca: InsertCrianca): Promise<Crianca>;
  getCrianca(id: number): Promise<Crianca | undefined>;
  updateCrianca(id: number, crianca: Partial<Crianca>): Promise<Crianca | undefined>;
  deleteCrianca(id: number): Promise<boolean>;
  getAllCriancas(): Promise<Crianca[]>;
  
  // Atendimento related
  createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento>;
  getAtendimento(id: number): Promise<Atendimento | undefined>;
  updateAtendimento(id: number, atendimento: Partial<Atendimento>): Promise<Atendimento | undefined>;
  deleteAtendimento(id: number): Promise<boolean>;
  getAllAtendimentos(): Promise<Atendimento[]>;
  getAtendimentosByCrianca(criancaId: number): Promise<Atendimento[]>;
  getAtendimentosByUsuario(usuarioId: number): Promise<Atendimento[]>;
  
  // UsuarioTipoAtendimento related
  createUsuarioTipoAtendimento(relacao: InsertUsuarioTipoAtendimento): Promise<UsuarioTipoAtendimento>;
  getUsuarioTiposAtendimento(usuarioId: number): Promise<UsuarioTipoAtendimento[]>;
  deleteUsuarioTipoAtendimento(id: number): Promise<boolean>;
  
  // CriancaTipoAtendimento related
  createCriancaTipoAtendimento(relacao: InsertCriancaTipoAtendimento): Promise<CriancaTipoAtendimento>;
  getCriancaTiposAtendimento(criancaId: number): Promise<CriancaTipoAtendimento[]>;
  deleteCriancaTipoAtendimento(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Tipo Atendimento methods
  async createTipoAtendimento(tipo: InsertTipoAtendimento): Promise<TipoAtendimento> {
    const [tipoAtendimento] = await db.insert(tiposAtendimento).values(tipo).returning();
    return tipoAtendimento;
  }
  
  async getTipoAtendimento(id: number): Promise<TipoAtendimento | undefined> {
    const [tipo] = await db.select().from(tiposAtendimento).where(eq(tiposAtendimento.id, id));
    return tipo;
  }
  
  async getTipoAtendimentoBySigla(sigla: string): Promise<TipoAtendimento | undefined> {
    const [tipo] = await db.select().from(tiposAtendimento).where(eq(tiposAtendimento.sigla, sigla));
    return tipo;
  }
  
  async updateTipoAtendimento(id: number, tipoData: Partial<TipoAtendimento>): Promise<TipoAtendimento | undefined> {
    const [updatedTipo] = await db
      .update(tiposAtendimento)
      .set(tipoData)
      .where(eq(tiposAtendimento.id, id))
      .returning();
    return updatedTipo;
  }
  
  async deleteTipoAtendimento(id: number): Promise<boolean> {
    const [deletedTipo] = await db
      .delete(tiposAtendimento)
      .where(eq(tiposAtendimento.id, id))
      .returning();
    return !!deletedTipo;
  }
  
  async getAllTiposAtendimento(): Promise<TipoAtendimento[]> {
    return await db.select().from(tiposAtendimento);
  }
  
  // Criança methods
  async createCrianca(crianca: InsertCrianca): Promise<Crianca> {
    const [novaCrianca] = await db.insert(criancas).values(crianca).returning();
    return novaCrianca;
  }
  
  async getCrianca(id: number): Promise<Crianca | undefined> {
    const [crianca] = await db.select().from(criancas).where(eq(criancas.id, id));
    return crianca;
  }
  
  async updateCrianca(id: number, criancaData: Partial<Crianca>): Promise<Crianca | undefined> {
    const [updatedCrianca] = await db
      .update(criancas)
      .set(criancaData)
      .where(eq(criancas.id, id))
      .returning();
    return updatedCrianca;
  }
  
  async deleteCrianca(id: number): Promise<boolean> {
    const [deletedCrianca] = await db
      .delete(criancas)
      .where(eq(criancas.id, id))
      .returning();
    return !!deletedCrianca;
  }
  
  async getAllCriancas(): Promise<Crianca[]> {
    return await db.select().from(criancas);
  }
  
  // Atendimento methods
  async createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento> {
    const [novoAtendimento] = await db.insert(atendimentos).values(atendimento).returning();
    return novoAtendimento;
  }
  
  async getAtendimento(id: number): Promise<Atendimento | undefined> {
    const [atendimento] = await db.select().from(atendimentos).where(eq(atendimentos.id, id));
    return atendimento;
  }
  
  async updateAtendimento(id: number, atendimentoData: Partial<Atendimento>): Promise<Atendimento | undefined> {
    const [updatedAtendimento] = await db
      .update(atendimentos)
      .set(atendimentoData)
      .where(eq(atendimentos.id, id))
      .returning();
    return updatedAtendimento;
  }
  
  async deleteAtendimento(id: number): Promise<boolean> {
    const [deletedAtendimento] = await db
      .delete(atendimentos)
      .where(eq(atendimentos.id, id))
      .returning();
    return !!deletedAtendimento;
  }
  
  async getAllAtendimentos(): Promise<Atendimento[]> {
    return await db.select().from(atendimentos);
  }
  
  async getAtendimentosByCrianca(criancaId: number): Promise<Atendimento[]> {
    return await db.select().from(atendimentos).where(eq(atendimentos.criancaId, criancaId));
  }
  
  async getAtendimentosByUsuario(usuarioId: number): Promise<Atendimento[]> {
    return await db.select().from(atendimentos).where(eq(atendimentos.usuarioId, usuarioId));
  }
  
  // UsuarioTipoAtendimento methods
  async createUsuarioTipoAtendimento(relacao: InsertUsuarioTipoAtendimento): Promise<UsuarioTipoAtendimento> {
    const [novaRelacao] = await db.insert(usuarioTiposAtendimento).values(relacao).returning();
    return novaRelacao;
  }
  
  async getUsuarioTiposAtendimento(usuarioId: number): Promise<UsuarioTipoAtendimento[]> {
    return await db.select().from(usuarioTiposAtendimento).where(eq(usuarioTiposAtendimento.usuarioId, usuarioId));
  }
  
  async deleteUsuarioTipoAtendimento(id: number): Promise<boolean> {
    const [deletedRelacao] = await db
      .delete(usuarioTiposAtendimento)
      .where(eq(usuarioTiposAtendimento.id, id))
      .returning();
    return !!deletedRelacao;
  }
  
  // CriancaTipoAtendimento methods
  async createCriancaTipoAtendimento(relacao: InsertCriancaTipoAtendimento): Promise<CriancaTipoAtendimento> {
    const [novaRelacao] = await db.insert(criancaTiposAtendimento).values(relacao).returning();
    return novaRelacao;
  }
  
  async getCriancaTiposAtendimento(criancaId: number): Promise<CriancaTipoAtendimento[]> {
    return await db.select().from(criancaTiposAtendimento).where(eq(criancaTiposAtendimento.criancaId, criancaId));
  }
  
  async deleteCriancaTipoAtendimento(id: number): Promise<boolean> {
    const [deletedRelacao] = await db
      .delete(criancaTiposAtendimento)
      .where(eq(criancaTiposAtendimento.id, id))
      .returning();
    return !!deletedRelacao;
  }
}

export const storage = new DatabaseStorage();
