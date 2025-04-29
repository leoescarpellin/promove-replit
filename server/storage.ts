import { users, User, InsertUser, tiposAtendimento, TipoAtendimento, InsertTipoAtendimento, 
  criancas, Crianca, InsertCrianca, atendimentos, Atendimento, InsertAtendimento,
  usuarioTiposAtendimento, UsuarioTipoAtendimento, InsertUsuarioTipoAtendimento,
  criancaTiposAtendimento, CriancaTipoAtendimento, InsertCriancaTipoAtendimento } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tiposAtendimento: Map<number, TipoAtendimento>;
  private criancas: Map<number, Crianca>;
  private atendimentos: Map<number, Atendimento>;
  private usuarioTiposAtendimento: Map<number, UsuarioTipoAtendimento>;
  private criancaTiposAtendimento: Map<number, CriancaTipoAtendimento>;
  
  private userCurrentId: number;
  private tipoAtendimentoCurrentId: number;
  private criancaCurrentId: number;
  private atendimentoCurrentId: number;
  private usuarioTipoAtendimentoCurrentId: number;
  private criancaTipoAtendimentoCurrentId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tiposAtendimento = new Map();
    this.criancas = new Map();
    this.atendimentos = new Map();
    this.usuarioTiposAtendimento = new Map();
    this.criancaTiposAtendimento = new Map();
    
    this.userCurrentId = 1;
    this.tipoAtendimentoCurrentId = 1;
    this.criancaCurrentId = 1;
    this.atendimentoCurrentId = 1;
    this.usuarioTipoAtendimentoCurrentId = 1;
    this.criancaTipoAtendimentoCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Tipo Atendimento methods
  async createTipoAtendimento(tipo: InsertTipoAtendimento): Promise<TipoAtendimento> {
    const id = this.tipoAtendimentoCurrentId++;
    const tipoAtendimento: TipoAtendimento = { ...tipo, id, createdAt: new Date() };
    this.tiposAtendimento.set(id, tipoAtendimento);
    return tipoAtendimento;
  }
  
  async getTipoAtendimento(id: number): Promise<TipoAtendimento | undefined> {
    return this.tiposAtendimento.get(id);
  }
  
  async getTipoAtendimentoBySigla(sigla: string): Promise<TipoAtendimento | undefined> {
    return Array.from(this.tiposAtendimento.values()).find(
      (tipo) => tipo.sigla === sigla
    );
  }
  
  async updateTipoAtendimento(id: number, tipoData: Partial<TipoAtendimento>): Promise<TipoAtendimento | undefined> {
    const existingTipo = this.tiposAtendimento.get(id);
    if (!existingTipo) return undefined;
    
    const updatedTipo = { ...existingTipo, ...tipoData };
    this.tiposAtendimento.set(id, updatedTipo);
    return updatedTipo;
  }
  
  async deleteTipoAtendimento(id: number): Promise<boolean> {
    return this.tiposAtendimento.delete(id);
  }
  
  async getAllTiposAtendimento(): Promise<TipoAtendimento[]> {
    return Array.from(this.tiposAtendimento.values());
  }
  
  // Criança methods
  async createCrianca(crianca: InsertCrianca): Promise<Crianca> {
    const id = this.criancaCurrentId++;
    const novaCrianca: Crianca = { ...crianca, id, createdAt: new Date() };
    this.criancas.set(id, novaCrianca);
    return novaCrianca;
  }
  
  async getCrianca(id: number): Promise<Crianca | undefined> {
    return this.criancas.get(id);
  }
  
  async updateCrianca(id: number, criancaData: Partial<Crianca>): Promise<Crianca | undefined> {
    const existingCrianca = this.criancas.get(id);
    if (!existingCrianca) return undefined;
    
    const updatedCrianca = { ...existingCrianca, ...criancaData };
    this.criancas.set(id, updatedCrianca);
    return updatedCrianca;
  }
  
  async deleteCrianca(id: number): Promise<boolean> {
    return this.criancas.delete(id);
  }
  
  async getAllCriancas(): Promise<Crianca[]> {
    return Array.from(this.criancas.values());
  }
  
  // Atendimento methods
  async createAtendimento(atendimento: InsertAtendimento): Promise<Atendimento> {
    const id = this.atendimentoCurrentId++;
    const novoAtendimento: Atendimento = { ...atendimento, id, createdAt: new Date() };
    this.atendimentos.set(id, novoAtendimento);
    return novoAtendimento;
  }
  
  async getAtendimento(id: number): Promise<Atendimento | undefined> {
    return this.atendimentos.get(id);
  }
  
  async updateAtendimento(id: number, atendimentoData: Partial<Atendimento>): Promise<Atendimento | undefined> {
    const existingAtendimento = this.atendimentos.get(id);
    if (!existingAtendimento) return undefined;
    
    const updatedAtendimento = { ...existingAtendimento, ...atendimentoData };
    this.atendimentos.set(id, updatedAtendimento);
    return updatedAtendimento;
  }
  
  async deleteAtendimento(id: number): Promise<boolean> {
    return this.atendimentos.delete(id);
  }
  
  async getAllAtendimentos(): Promise<Atendimento[]> {
    return Array.from(this.atendimentos.values());
  }
  
  async getAtendimentosByCrianca(criancaId: number): Promise<Atendimento[]> {
    return Array.from(this.atendimentos.values()).filter(
      (atendimento) => atendimento.criancaId === criancaId
    );
  }
  
  async getAtendimentosByUsuario(usuarioId: number): Promise<Atendimento[]> {
    return Array.from(this.atendimentos.values()).filter(
      (atendimento) => atendimento.usuarioId === usuarioId
    );
  }
  
  // UsuarioTipoAtendimento methods
  async createUsuarioTipoAtendimento(relacao: InsertUsuarioTipoAtendimento): Promise<UsuarioTipoAtendimento> {
    const id = this.usuarioTipoAtendimentoCurrentId++;
    const novaRelacao: UsuarioTipoAtendimento = { ...relacao, id, createdAt: new Date() };
    this.usuarioTiposAtendimento.set(id, novaRelacao);
    return novaRelacao;
  }
  
  async getUsuarioTiposAtendimento(usuarioId: number): Promise<UsuarioTipoAtendimento[]> {
    return Array.from(this.usuarioTiposAtendimento.values()).filter(
      (relacao) => relacao.usuarioId === usuarioId
    );
  }
  
  async deleteUsuarioTipoAtendimento(id: number): Promise<boolean> {
    return this.usuarioTiposAtendimento.delete(id);
  }
  
  // CriancaTipoAtendimento methods
  async createCriancaTipoAtendimento(relacao: InsertCriancaTipoAtendimento): Promise<CriancaTipoAtendimento> {
    const id = this.criancaTipoAtendimentoCurrentId++;
    const novaRelacao: CriancaTipoAtendimento = { ...relacao, id, createdAt: new Date() };
    this.criancaTiposAtendimento.set(id, novaRelacao);
    return novaRelacao;
  }
  
  async getCriancaTiposAtendimento(criancaId: number): Promise<CriancaTipoAtendimento[]> {
    return Array.from(this.criancaTiposAtendimento.values()).filter(
      (relacao) => relacao.criancaId === criancaId
    );
  }
  
  async deleteCriancaTipoAtendimento(id: number): Promise<boolean> {
    return this.criancaTiposAtendimento.delete(id);
  }
}

export const storage = new MemStorage();
