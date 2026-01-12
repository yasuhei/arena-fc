# Arena FC - Backend

Backend do sistema Arena FC com notas decimais e SQLite.

## 🚀 Deploy no Railway

### 1. Criar conta no Railway:
https://railway.app

### 2. Conectar repositório:
- New Project → Deploy from GitHub repo
- Selecionar este repositório

### 3. Configurar variáveis (opcional):
```
NODE_ENV=production
PORT=3001
```

### 4. Deploy automático!
Railway detectará automaticamente o `package.json` e fará deploy.

## 🧪 Testar Localmente

```bash
npm install
npm run dev
```

API estará em: http://localhost:3001

## 📋 Endpoints

- `GET /api/players` - Listar jogadores
- `POST /api/players` - Criar jogador
- `PUT /api/players/:id` - Atualizar jogador
- `DELETE /api/players/:id` - Remover jogador
- `GET /api/players/stats` - Estatísticas

## 🎯 Exemplo de Uso

```bash
# Criar jogador
curl -X POST https://seu-backend.railway.app/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Jogador Teste", "rating": 4.5}'

# Listar jogadores
curl https://seu-backend.railway.app/api/players
```

## 💾 Banco de Dados

- SQLite com arquivo `arena_fc.db`
- Dados persistem entre deployments
- Backup automático disponível

## 🔧 Scripts Disponíveis

```bash
npm start          # Produção
npm run dev        # Desenvolvimento
npm run backup     # Criar backup
npm run backup:list # Listar backups
npm run clear      # Limpar jogadores
```