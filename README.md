# Arena FC - Sistema de Gerenciamento de Times

Sistema completo para gerenciar jogadores e montar times balanceados de futebol com sistema de avaliação por estrelas.

## 🚀 Funcionalidades

- **Gerenciamento de Jogadores**: Adicionar, editar e remover jogadores
- **Sistema de Notas**: Avaliação de 0 a 5 estrelas para cada jogador
- **Montagem Inteligente**: Algoritmo que balanceia times por soma de notas
- **Controle de Jogos**: Sistema de placar e resultados
- **Interface Responsiva**: Funciona em desktop e mobile
- **Banco de Dados**: Persistência com SQLite

## ⭐ Sistema de Avaliação

- **0 estrelas**: Muito Baixa
- **1 estrela**: Baixa  
- **2 estrelas**: Regular
- **3 estrelas**: Boa
- **4 estrelas**: Muito Boa
- **5 estrelas**: Excelente

## 🧮 Algoritmo de Balanceamento

O sistema usa um algoritmo inteligente que:
1. **Ordena** jogadores por nota (maior para menor)
2. **Distribui** sempre para o time com menor soma total
3. **Equilibra** as médias entre os times
4. **Exibe** soma total e média de cada time

Isso garante que os times tenham força similar baseada nas notas dos jogadores.

## 🛠️ Tecnologias

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Axios

### Backend
- Node.js + Express
- SQLite Database (better-sqlite3)
- API REST
- UUID para IDs únicos
- Persistência de dados

## 📦 Instalação

### Método Rápido (Windows)
```bash
# Clone o repositório
git clone <url-do-repo>
cd arena-fc

# Instale as dependências
npm install
cd backend && npm install && cd ..

# Execute o script de desenvolvimento
start-dev.bat
```

### Método Manual

#### 1. Frontend
```bash
npm install
npm run dev
```

#### 2. Backend
```bash
cd backend
npm install
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
cd backend && npm run dev

## 💾 Banco de Dados

O sistema usa **SQLite** para persistência dos dados, que é:
- **Simples**: Não precisa de instalação adicional
- **Leve**: Arquivo único no disco
- **Confiável**: Transações ACID
- **Portável**: Funciona em qualquer sistema

### Estrutura das Tabelas

#### Jogadores (players)
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Jogos (games) - Futuro
```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  team1_players TEXT NOT NULL, -- JSON array
  team2_players TEXT NOT NULL, -- JSON array
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Localização do Banco
- Arquivo: `backend/arena_fc.db`
- Criado automaticamente na primeira execução
- Dados iniciais inseridos automaticamente

## 📋 API Endpoints

### Jogadores
- `GET /api/players` - Lista todos os jogadores
- `POST /api/players` - Cria novo jogador
- `PUT /api/players/:id` - Atualiza jogador
- `DELETE /api/players/:id` - Remove jogador
- `GET /api/players/stats` - Estatísticas dos jogadores
- `POST /api/games` - Salva resultado de jogo (futuro)
- `GET /api/games` - Lista jogos salvos (futuro)

### Exemplo de Uso da API
```bash
# Criar jogador
curl -X POST http://localhost:3001/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Novo Jogador", "rating": 4}'

# Listar jogadores
curl http://localhost:3001/api/players
```

## 🎮 Como Usar

1. **Gerenciar Jogadores**: Clique em "Gerenciar Jogadores" para adicionar/editar/remover
2. **Selecionar Participantes**: Marque os jogadores que vão participar
3. **Montar Times**: Clique em "Montar Times Balanceados"
4. **Escolher Exemplo**: Selecione uma das 3 opções geradas
5. **Registrar Jogos**: Adicione placares e confirme resultados

## ⚽ Algoritmo de Balanceamento

- **Ordenação por Nota**: Jogadores ordenados do maior para menor rating
- **Distribuição Inteligente**: Sempre adiciona ao time com menor soma total
- **Equilíbrio**: Garante que as médias dos times sejam similares
- **Transparência**: Mostra soma total e média de cada time
- **Flexibilidade**: Adapta-se a diferentes quantidades de jogadores

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
arena-fc/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── hooks/             # Custom hooks
│   └── ...
├── backend/               # Backend Node.js
│   ├── server.js          # Servidor Express
│   └── package.json
├── start-dev.bat          # Script de desenvolvimento
└── README.md
```

### Scripts Disponíveis

#### Frontend
- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

#### Backend
- `npm run dev` - Desenvolvimento com auto-reload
- `npm start` - Produção

## 🐛 Troubleshooting

### Erro de Conexão
- Verifique se o backend está rodando na porta 3001
- Confirme se não há conflitos de porta
- Teste a API diretamente: `curl http://localhost:3001/api/players`

### Problemas de CORS
- O backend já está configurado com CORS habilitado
- Verifique se as URLs estão corretas

## 📝 Próximas Funcionalidades

- [ ] Persistência em banco de dados
- [ ] Histórico de jogos
- [ ] Estatísticas de jogadores
- [ ] Sistema de ranking
- [ ] Exportar resultados
- [ ] Notificações push

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request