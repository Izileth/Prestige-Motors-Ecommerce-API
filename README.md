# API Prestige Motors Documentation

Bem Vindo a API da Prestige Motors

Projeto desenvolvido 100% Autodidata

# Getting Started

To run this application:

```bash
npm install
node src/server.js
```

# Building For Development

```bash
npm nodemon src/server.js
```



## 🌐 Access Routes

### 🧪 Test


- Access the test route:  
  `GET {url}/api/test`
  



### 📂 Access Routes – Data & Options

- Access user routes:  
  `GET {url}/api/users`

- Access vehicle routes:  
  `GET {url}/api/vehicles`

- Access sales & ad routes:  
  `GET {url}/api/sales`

- Access Negotiations routes:  
  `GET {url}/api/negotiations`



## 🔐 Auth Access

### 🌐 Access Auth Routes – Public

| Endpoint                                | Método  | Descrição                    |
|-----------------------------------------|---------|------------------------------|
| `/api/users/login`                      | `POST`  | Acesso de login              |
| `/api/users/register`                   | `POST`  | Registro de novo usuário     |
| `/api/users/forgot-password`            | `POST`  | Solicitar recuperação de senha |
| `/api/users/reset-password`             | `POST`  | Redefinir senha              |



### 🔒 Access Auth Routes – Private

| Endpoint                    | Método | Descrição                    |
|-----------------------------|--------|------------------------------|
| `/api/users/check-session` | `GET`  | Validação do token (sessão)  |
| `/api/users/logout`        | `POST` | Encerrar sessão (logout)     |



## 👤 User Access

### 🔒 Access User Routes – Private

| Endpoint                             | Método   | Descrição                                |
|--------------------------------------|----------|------------------------------------------|
| `/api/users`                         | `GET`    | Listar todos os usuários                 |
| `/api/users/me`                      | `GET`    | Obter informações do usuário logado      |
| `/api/users/:id`                     | `GET`    | Obter informações de um usuário por ID   |
| `/api/users/:id`                     | `PUT`    | Atualizar informações de um usuário      |
| `/api/users/:id/avatar`             | `POST`   | Atualizar avatar do usuário              |
| `/api/users/:id`                     | `DELETE` | Deletar usuário                          |
| `/api/users/:id/stats`              | `GET`    | Obter estatísticas do usuário            |


### 📬 Access User Address Data – Private

| Endpoint                                 | Método   | Descrição                         |
|------------------------------------------|----------|-----------------------------------|
| `/user/:id/addresses`                   | `GET`    | Obter endereços do usuário        |
| `/user/:id/addresses`                   | `POST`   | Adicionar novo endereço           |
| `/user/addresses/:addressId`           | `PUT`    | Atualizar endereço do usuário     |
| `/user/addresses/:addressId`           | `DELETE` | Deletar endereço do usuário       |

# 🚗 Vehicle Access

### 🌐 Access Vehicle Information & Data – Public

| Endpoint                                          | Método   | Descrição                                        |
|---------------------------------------------------|----------|--------------------------------------------------|
| `/api/vehicles`                                   | `GET`    | Listar informações e dados dos veículos          |
| `/api/vehicles/stats`                             | `GET`    | Obter estatísticas gerais dos veículos           |
| `/api/vehicles/:id`                               | `GET`    | Obter informações de um veículo por ID           |
| `/api/vehicles/:id/reviews`                       | `GET`    | Listar avaliações de um veículo específico       |
| `/api/vehicles/:id/details`                       | `GET`    | Obter detalhes completos de um veículo           |
| `/api/vehicles/vendors/:vendorId`                 | `GET`    | Obter veículos de um vendedor específico         |

---

### 🔒 Access Vehicle Information & Data – Private

| Endpoint                                          | Método   | Descrição                                        |
|---------------------------------------------------|----------|--------------------------------------------------|
| `/api/vehicles`                                   | `POST`   | Criar novo veículo                               |
| `/api/vehicles/:id/images`                        | `POST`   | Enviar imagem para o veículo                     |
| `/api/vehicles/:id/images`                        | `DELETE` | Deletar imagem do veículo                        |
| `/api/vehicles/:id/videos`                        | `POST`   | Enviar vídeo para o veículo                      |
| `/api/vehicles/me/vehicles`                       | `GET`    | Listar veículos do usuário                       |
| `/api/vehicles/me/vehicles-stats`                 | `GET`    | Estatísticas dos veículos do usuário             |
| `/api/vehicles/favorites`                         | `POST`   | Adicionar veículo aos favoritos                  |
| `/api/vehicles/me/favorites`                      | `GET`    | Listar veículos favoritos do usuário             |
| `/api/vehicles/views`                             | `POST`   | Criar visualização de veículo                    |
| `/api/vehicles/me/views`                          | `GET`    | Listar visualizações de veículos do usuário      |
| `/api/vehicles/reviews`                           | `POST`   | Criar avaliação para veículo                     |
| `/api/vehicles/reviews`                           | `GET`    | Listar avaliações feitas pelo usuário            |
| `/api/vehicles/:id`                               | `PUT`    | Atualizar informações de um veículo              |
| `/api/vehicles/:id/status`                        | `PUT`    | Atualizar status do veículo                      |
| `/api/vehicles/:id`                               | `DELETE` | Deletar veículo                                  |
| `/api/vehicles/:id/favorites`                     | `DELETE` | Remover veículo dos favoritos                    |

# 💼 Negotiations & Sales Access

### 🔒 Access Sales Information & Data – Private

| Endpoint                                         | Método   | Descrição                                             |
|--------------------------------------------------|----------|-------------------------------------------------------|
| `/api/sales/stats`                              | `GET`    | Obter estatísticas gerais de vendas                   |
| `/api/sales/:id`                                | `GET`    | Obter detalhes de uma venda por ID                    |
| `/api/sales`                                    | `POST`   | Criar nova venda                                      |
| `/api/sales/:id`                                | `PUT`    | Atualizar informações de uma venda                    |
| `/api/sales/vehicles/:vehicleId`                | `GET`    | Obter histórico de vendas de um veículo               |
| `/api/sales/:userId/stats`                      | `GET`    | Obter estatísticas de vendas de um usuário            |
| `/api/sales/transactions/:userId`                     | `GET`    | Listar todas as transações e ações feitas por um usuário como comprador & vendedor   |
| `/api/sales/:userId/history`                     | `GET`    | Listar o histório de vendas e compras do usuário


| `/api/sales/buyers/:userId`                     | `GET`    | Listar compras feitas por um usuário como comprador   |
| `/api/sales/sellers/:userId`                    | `GET`    | Listar vendas feitas por um usuário como vendedor     |


### 🔒 Access Negotiations & Discussions – Private

| Endpoint                                         | Método   | Descrição                                             |
|--------------------------------------------------|----------|-------------------------------------------------------|
| `/api/negotiations/user`                              | `GET`    | Obter lista de negociações do usuário                |
| `/api/negotiations/:negotiationId`                                | `GET`    | Obter detalhes de uma Negociação por ID                    |
| `/api/negotiations/:negotiationId/history`                                    | `GET`   | Obter histório de propostas de uma negociação em especifico                                 |
| `/api/negotiations/`                                | `POST`    | Criar uma nova negociação                 |
| `/api/negotiations/:negotiationId/messages`                | `POST`    | Criar uma nova Menssagem para a negociação               |
| `/api/negotiations/:negotiationId/respond`                      | `PUT`    | Responder a Menssagem de uma negociação          |
| `/api/negotiations/:negotiationId`                     | `DELETE`    | Deletar uma negociação


### 🔐 Autenticação e Autorização

**Rotas Públicas**
- Não requerem autenticação  
- Acessíveis a qualquer cliente  

**Rotas Privadas**
- Requerem token de autenticação válido  
- Headers obrigatórios configurados  
- Políticas CORS aplicadas  

---

### 📝 Notas Importantes

- **Prefixo Base:** Todas as rotas utilizam o prefixo `/api/`  
- **Autenticação:** Rotas privadas requerem headers de autenticação apropriados  & Cookies de Proxys Autorizados
- **CORS:** Configurado para rotas que necessitam de acesso cross-origin  
- **Parâmetros Dinâmicos:** `:Id`, `::vendorId`, `:userId`, `:addressId`, `:negotiationId`, `me`

---

### ⚙️ Tecnologias

- Node.js  
- Express.js  
- Prisma
- Cors
- Multer
- Cloudinary
- Helmet
- Bcrypt
- Zod
- Morgan
- Mongoose
- Nodemalier
- MongoDB
- Nodemon (desenvolvimento)  

---

Desenvolvido com ❤️ para a API **Prestige Motors**