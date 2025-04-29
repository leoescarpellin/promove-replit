import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTipoAtendimentoSchema, insertCriancaSchema, insertAtendimentoSchema, 
  insertUsuarioTipoAtendimentoSchema, insertCriancaTipoAtendimentoSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Middleware para verificar se o usuário está autenticado
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autenticado" });
  };

  // Middleware para verificar se o usuário é admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Permissão negada" });
  };

  // Rotas de usuários
  app.get("/api/usuarios", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remover senhas antes de enviar
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/usuarios/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.put("/api/usuarios/:id", isAuthenticated, async (req, res) => {
    try {
      // Verificar se usuário está atualizando o próprio perfil ou é admin
      if (req.user.id !== parseInt(req.params.id) && !req.user.isAdmin) {
        return res.status(403).json({ message: "Permissão negada" });
      }

      const { password, confirmPassword, ...userData } = req.body;
      const updatedUser = await storage.updateUser(parseInt(req.params.id), userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/usuarios/:id", isAdmin, async (req, res) => {
    try {
      const result = await storage.deleteUser(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Rotas de tipos de atendimento
  app.get("/api/tipos-atendimento", isAuthenticated, async (req, res) => {
    try {
      const tipos = await storage.getAllTiposAtendimento();
      res.json(tipos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tipos de atendimento" });
    }
  });

  app.get("/api/tipos-atendimento/:id", isAuthenticated, async (req, res) => {
    try {
      const tipo = await storage.getTipoAtendimento(parseInt(req.params.id));
      if (!tipo) {
        return res.status(404).json({ message: "Tipo de atendimento não encontrado" });
      }
      res.json(tipo);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tipo de atendimento" });
    }
  });

  app.post("/api/tipos-atendimento", isAuthenticated, async (req, res) => {
    try {
      const validation = insertTipoAtendimentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const existingTipo = await storage.getTipoAtendimentoBySigla(validation.data.sigla);
      if (existingTipo) {
        return res.status(400).json({ message: "Já existe um tipo de atendimento com esta sigla" });
      }

      const novoTipo = await storage.createTipoAtendimento(validation.data);
      res.status(201).json(novoTipo);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar tipo de atendimento" });
    }
  });

  app.put("/api/tipos-atendimento/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertTipoAtendimentoSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      // Se a sigla está sendo alterada, verificar se já existe
      if (req.body.sigla) {
        const existingTipo = await storage.getTipoAtendimentoBySigla(req.body.sigla);
        if (existingTipo && existingTipo.id !== parseInt(req.params.id)) {
          return res.status(400).json({ message: "Já existe um tipo de atendimento com esta sigla" });
        }
      }

      const updatedTipo = await storage.updateTipoAtendimento(parseInt(req.params.id), validation.data);
      if (!updatedTipo) {
        return res.status(404).json({ message: "Tipo de atendimento não encontrado" });
      }

      res.json(updatedTipo);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar tipo de atendimento" });
    }
  });

  app.delete("/api/tipos-atendimento/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteTipoAtendimento(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Tipo de atendimento não encontrado" });
      }
      res.json({ message: "Tipo de atendimento excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir tipo de atendimento" });
    }
  });

  // Rotas de crianças/pacientes
  app.get("/api/criancas", isAuthenticated, async (req, res) => {
    try {
      const criancas = await storage.getAllCriancas();
      res.json(criancas);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar crianças" });
    }
  });

  app.get("/api/criancas/:id", isAuthenticated, async (req, res) => {
    try {
      const crianca = await storage.getCrianca(parseInt(req.params.id));
      if (!crianca) {
        return res.status(404).json({ message: "Criança não encontrada" });
      }
      res.json(crianca);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar criança" });
    }
  });

  app.post("/api/criancas", isAuthenticated, async (req, res) => {
    try {
      const validation = insertCriancaSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const novaCrianca = await storage.createCrianca(validation.data);
      res.status(201).json(novaCrianca);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar criança" });
    }
  });

  app.put("/api/criancas/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertCriancaSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const updatedCrianca = await storage.updateCrianca(parseInt(req.params.id), validation.data);
      if (!updatedCrianca) {
        return res.status(404).json({ message: "Criança não encontrada" });
      }

      res.json(updatedCrianca);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar criança" });
    }
  });

  app.delete("/api/criancas/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteCrianca(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Criança não encontrada" });
      }
      res.json({ message: "Criança excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir criança" });
    }
  });

  // Rotas de atendimentos
  app.get("/api/atendimentos", isAuthenticated, async (req, res) => {
    try {
      const atendimentos = await storage.getAllAtendimentos();
      res.json(atendimentos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atendimentos" });
    }
  });

  app.get("/api/atendimentos/crianca/:id", isAuthenticated, async (req, res) => {
    try {
      const atendimentos = await storage.getAtendimentosByCrianca(parseInt(req.params.id));
      res.json(atendimentos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atendimentos da criança" });
    }
  });

  app.get("/api/atendimentos/usuario/:id", isAuthenticated, async (req, res) => {
    try {
      const atendimentos = await storage.getAtendimentosByUsuario(parseInt(req.params.id));
      res.json(atendimentos);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atendimentos do usuário" });
    }
  });

  app.get("/api/atendimentos/:id", isAuthenticated, async (req, res) => {
    try {
      const atendimento = await storage.getAtendimento(parseInt(req.params.id));
      if (!atendimento) {
        return res.status(404).json({ message: "Atendimento não encontrado" });
      }
      res.json(atendimento);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atendimento" });
    }
  });

  app.post("/api/atendimentos", isAuthenticated, async (req, res) => {
    try {
      const validation = insertAtendimentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const novoAtendimento = await storage.createAtendimento(validation.data);
      res.status(201).json(novoAtendimento);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar atendimento" });
    }
  });

  app.put("/api/atendimentos/:id", isAuthenticated, async (req, res) => {
    try {
      const validation = insertAtendimentoSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const updatedAtendimento = await storage.updateAtendimento(parseInt(req.params.id), validation.data);
      if (!updatedAtendimento) {
        return res.status(404).json({ message: "Atendimento não encontrado" });
      }

      res.json(updatedAtendimento);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar atendimento" });
    }
  });

  app.delete("/api/atendimentos/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteAtendimento(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Atendimento não encontrado" });
      }
      res.json({ message: "Atendimento excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir atendimento" });
    }
  });

  // Rotas de relação UsuarioTipoAtendimento
  app.get("/api/usuario-tipos-atendimento/:usuarioId", isAuthenticated, async (req, res) => {
    try {
      const relacoes = await storage.getUsuarioTiposAtendimento(parseInt(req.params.usuarioId));
      res.json(relacoes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar relações de tipos de atendimento do usuário" });
    }
  });

  app.post("/api/usuario-tipos-atendimento", isAuthenticated, async (req, res) => {
    try {
      const validation = insertUsuarioTipoAtendimentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const novaRelacao = await storage.createUsuarioTipoAtendimento(validation.data);
      res.status(201).json(novaRelacao);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar relação de tipo de atendimento para usuário" });
    }
  });

  app.delete("/api/usuario-tipos-atendimento/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteUsuarioTipoAtendimento(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Relação não encontrada" });
      }
      res.json({ message: "Relação excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir relação" });
    }
  });

  // Rotas de relação CriancaTipoAtendimento
  app.get("/api/crianca-tipos-atendimento/:criancaId", isAuthenticated, async (req, res) => {
    try {
      const relacoes = await storage.getCriancaTiposAtendimento(parseInt(req.params.criancaId));
      res.json(relacoes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar relações de tipos de atendimento da criança" });
    }
  });

  app.post("/api/crianca-tipos-atendimento", isAuthenticated, async (req, res) => {
    try {
      const validation = insertCriancaTipoAtendimentoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: validation.error.format() });
      }

      const novaRelacao = await storage.createCriancaTipoAtendimento(validation.data);
      res.status(201).json(novaRelacao);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar relação de tipo de atendimento para criança" });
    }
  });

  app.delete("/api/crianca-tipos-atendimento/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteCriancaTipoAtendimento(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Relação não encontrada" });
      }
      res.json({ message: "Relação excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir relação" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
