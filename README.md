# API Prestige Motors Documentation

Welcome to Prestige Motors API!

The Project of API development for Prestige Motors Platform


# 📚 Índice

- [Getting Started](#getting-started)
- [Building For Development](#building-for-development)
- [Access Routes](#access-routes)
  - [Test](#test)
  - [Access Routes – Data & Options](#access-routes--data--options)
- [🔐 Auth Access](#-auth-access)
  - [Access Auth Routes – Public](#access-auth-routes--public)
  - [Access Auth Routes – Private](#access-auth-routes--private)
- [👤 User Access](#-user-access)
  - [Access User Routes – Private](#access-user-routes--private)
  - [Access User Address Data – Private](#access-user-address-data--private)
- [🚗 Vehicle Access](#-vehicle-access)
  - [Access Vehicle Information & Data – Public](#access-vehicle-information--data--public)
  - [Access Vehicle Information & Data – Private](#access-vehicle-information--data--private)
- [💼 Negotiations & Sales Access](#-negotiations--sales-access)
  - [Access Sales Information & Data – Private](#access-sales-information--data--private)


# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Development

```bash
npm nodemon server.js
```



## Access Routes

### Test

- Access the test route:  
  `GET {url}/api/test`



### 📂 Access Routes – Data & Options

- Access user routes:  
  `GET {url}/api/users`

- Access vehicle routes:  
  `GET {url}/api/vehicles`

- Access sales & ad routes:  
  `GET {url}/api/sales`



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
| `/api/sales/buyers/:userId`                     | `GET`    | Listar compras feitas por um usuário como comprador   |
| `/api/sales/sellers/:userId`                    | `GET`    | Listar vendas feitas por um usuário como vendedor     |
