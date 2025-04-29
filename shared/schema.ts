import { pgTable, text, serial, integer, boolean, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  profissao: text("profissao"),
  endereco: text("endereco"),
  dataNascimento: date("data_nascimento"),
  pix: text("pix"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tipos de Atendimento
export const tiposAtendimento = pgTable("tipos_atendimento", {
  id: serial("id").primaryKey(),
  sigla: text("sigla").notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTipoAtendimentoSchema = createInsertSchema(tiposAtendimento).omit({
  id: true,
  createdAt: true,
});

export type InsertTipoAtendimento = z.infer<typeof insertTipoAtendimentoSchema>;
export type TipoAtendimento = typeof tiposAtendimento.$inferSelect;

// Relação entre Usuários e Tipos de Atendimento
export const usuarioTiposAtendimento = pgTable("usuario_tipos_atendimento", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => users.id),
  tipoAtendimentoId: integer("tipo_atendimento_id").notNull().references(() => tiposAtendimento.id),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUsuarioTipoAtendimentoSchema = createInsertSchema(usuarioTiposAtendimento).omit({
  id: true,
  createdAt: true,
});

export type InsertUsuarioTipoAtendimento = z.infer<typeof insertUsuarioTipoAtendimentoSchema>;
export type UsuarioTipoAtendimento = typeof usuarioTiposAtendimento.$inferSelect;

// Crianças/Pacientes
export const criancas = pgTable("criancas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  dataNascimento: date("data_nascimento"),
  pai: text("pai"),
  mae: text("mae"),
  email: text("email"),
  telefone: text("telefone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCriancaSchema = createInsertSchema(criancas).omit({
  id: true,
  createdAt: true,
});

export type InsertCrianca = z.infer<typeof insertCriancaSchema>;
export type Crianca = typeof criancas.$inferSelect;

// Relação entre Crianças e Tipos de Atendimento
export const criancaTiposAtendimento = pgTable("crianca_tipos_atendimento", {
  id: serial("id").primaryKey(),
  criancaId: integer("crianca_id").notNull().references(() => criancas.id),
  tipoAtendimentoId: integer("tipo_atendimento_id").notNull().references(() => tiposAtendimento.id),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCriancaTipoAtendimentoSchema = createInsertSchema(criancaTiposAtendimento).omit({
  id: true,
  createdAt: true,
});

export type InsertCriancaTipoAtendimento = z.infer<typeof insertCriancaTipoAtendimentoSchema>;
export type CriancaTipoAtendimento = typeof criancaTiposAtendimento.$inferSelect;

// Atendimentos
export const atendimentos = pgTable("atendimentos", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => users.id),
  criancaId: integer("crianca_id").notNull().references(() => criancas.id),
  tipoAtendimentoId: integer("tipo_atendimento_id").notNull().references(() => tiposAtendimento.id),
  dataInicio: timestamp("data_inicio").notNull(),
  dataFim: timestamp("data_fim").notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAtendimentoSchema = createInsertSchema(atendimentos).omit({
  id: true,
  createdAt: true,
});

export type InsertAtendimento = z.infer<typeof insertAtendimentoSchema>;
export type Atendimento = typeof atendimentos.$inferSelect;

// Schema para login
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginData = z.infer<typeof loginSchema>;
