
# Prestige Motors API

![Prestige Motors](https://i.imgur.com/tG3t017.png)

## 🏁 Sobre o Projeto

A **Prestige Motors API** é o backend para uma plataforma de classificados de veículos de luxo, esportivos e exóticos. Ela oferece uma solução completa para o gerenciamento de anúncios, negociações e vendas de carros, com foco em uma experiência de usuário segura e eficiente.

---

## ✨ Funcionalidades Principais

*   **Autenticação e Autorização:** Sistema completo de registro, login e gerenciamento de sessão com JSON Web Tokens (JWT), incluindo rotas protegidas e controle de acesso baseado em roles (níveis de permissão).
*   **Gerenciamento de Usuários:** CRUD completo para usuários, incluindo gerenciamento de endereços e avatares.
*   **Catálogo de Veículos:** CRUD completo para veículos, com suporte para múltiplas imagens e vídeos, especificações detalhadas e status de disponibilidade.
*   **Sistema de Favoritos:** Usuários podem salvar seus veículos de interesse.
*   **Avaliações e Reviews:** Usuários podem avaliar os veículos e deixar comentários.
*   **Sistema de Negociações:** Um módulo completo para que compradores e vendedores possam negociar o preço de um veículo de forma privada e segura.
*   **Registro de Vendas:** Funcionalidade para registrar as vendas concluídas, vinculando comprador, vendedor e veículo.
*   **Métricas e Estatísticas:** Endpoints para obter estatísticas sobre vendas, veículos e atividades dos usuários.
*   **Upload de Mídia:** Suporte para upload de imagens e vídeos para a nuvem (Cloudinary).

---

## 🛠️ Tecnologias Utilizadas

*   **Node.js:** Ambiente de execução do JavaScript no servidor.
*   **Express.js:** Framework para a construção da API.
*   **Prisma:** ORM para a interação com o banco de dados.
*   **MongoDB:** Banco de dados NoSQL utilizado no projeto.
*   **JSON Web Token (JWT):** Para a criação de tokens de autenticação.
*   **Bcrypt:** Para a criptografia de senhas.
*   **Zod:** Para a validação de schemas e dados.
*   **Cloudinary:** Para o armazenamento de imagens e vídeos na nuvem.
*   **Nodemailer:** Para o envio de e-mails (recuperação de senha, etc.).
*   **Multer:** Middleware para o upload de arquivos.
*   **Helmet, CORS, Express-Rate-Limit, XSS-Clean:** Middlewares de segurança.

---

## 🚀 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/prestige-motors-api.git
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure as variáveis de ambiente:**
    *   Crie um arquivo `.env` na raiz do projeto.
    *   Adicione as seguintes variáveis:
        ```
        DATABASE_URL="sua_url_de_conexao_com_o_mongodb"
        JWT_SECRET="seu_segredo_jwt"
        CLOUDINARY_CLOUD_NAME="seu_cloud_name"
        CLOUDINARY_API_KEY="sua_api_key"
        CLOUDINARY_API_SECRET="seu_api_secret"
        NODEMAILER_HOST="seu_host_de_email"
        NODEMAILER_PORT="sua_porta_de_email"
        NODEMAILER_USER="seu_usuario_de_email"
        NODEMAILER_PASS="sua_senha_de_email"
        ```
4.  **Execute as migrações do Prisma:**
    ```bash
    npx prisma migrate dev
    ```
5.  **Inicie o servidor:**
    ```bash
    npm start
    ```

---

## 🗺️ Mapeamento de Rotas (Endpoints)

A seguir, um detalhamento completo de todas as rotas da API, incluindo seus métodos, URLs, o que elas esperam como entrada (parâmetros, corpo da requisição) e o que elas retornam.

### 👤 Autenticação e Usuários (`/api/users`)

| Método | Rota                                | Descrição                                                                 | Autenticação | Corpo da Requisição (Body)                               | Resposta (Sucesso)                                     |
| :----- | :---------------------------------- | :-------------------------------------------------------------------------- | :------------- | :-------------------------------------------------------- | :----------------------------------------------------- |
| `POST` | `/register`                         | Registra um novo usuário.                                                   | Nenhuma        | `nome`, `email`, `senha`                                  | `token`, `user`                                        |
| `POST` | `/login`                            | Autentica um usuário e retorna um token.                                    | Nenhuma        | `email`, `senha`                                          | `token`, `user`                                        |
| `POST` | `/logout`                           | Desloga o usuário (invalida o token).                                       | Requerida      | -                                                         | Mensagem de sucesso                                    |
| `POST` | `/forgot-password`                  | Envia um e-mail com o link para resetar a senha.                            | Nenhuma        | `email`                                                   | Mensagem de sucesso                                    |
| `POST` | `/reset-password`                   | Reseta a senha do usuário.                                                  | Nenhuma        | `token`, `novaSenha`                                      | Mensagem de sucesso                                    |
| `GET`  | `/check-session`                    | Verifica se a sessão do usuário é válida.                                   | Requerida      | -                                                         | `user`                                                 |
| `GET`  | `/`                                 | Lista todos os usuários.                                                    | Requerida      | -                                                         | Array de `user`                                        |
| `GET`  | `/:id`                              | Busca um usuário pelo ID.                                                   | Requerida      | -                                                         | Objeto `user`                                          |
| `PUT`  | `/:id`                              | Atualiza os dados de um usuário.                                            | Requerida      | `nome`, `email`, `telefone`, etc.                         | Objeto `user` atualizado                               |
| `DELETE`| `/:id`                              | Deleta um usuário.                                                          | Requerida      | -                                                         | Mensagem de sucesso                                    |
| `GET`  | `/:id/stats`                        | Obtém estatísticas do usuário.                                              | Requerida      | -                                                         | Objeto com estatísticas                                |
| `POST` | `/:id/avatar`                       | Faz o upload do avatar do usuário.                                          | Requerida      | `FormData` com o arquivo da imagem                        | Objeto `user` com a URL do novo avatar                 |
| `GET`  | `/:id/addresses`                    | Lista os endereços de um usuário.                                           | Requerida      | -                                                         | Array de `address`                                     |
| `POST` | `/:id/addresses`                    | Cria um novo endereço para o usuário.                                       | Requerida      | `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado` | Objeto `address` criado                                |
| `PUT`  | `/addresses/:addressId`             | Atualiza um endereço.                                                       | Requerida      | `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado` | Objeto `address` atualizado                            |
| `DELETE`| `/addresses/:addressId`             | Deleta um endereço.                                                         | Requerida      | -                                                         | Mensagem de sucesso                                    |

### 🚗 Veículos (`/api/vehicles`)

| Método | Rota                                | Descrição                                                                 | Autenticação | Corpo da Requisição (Body)                               | Resposta (Sucesso)                                     |
| :----- | :---------------------------------- | :-------------------------------------------------------------------------- | :------------- | :-------------------------------------------------------- | :----------------------------------------------------- |
| `POST` | `/`                                 | Cria um novo anúncio de veículo.                                            | Requerida      | `marca`, `modelo`, `anoFabricacao`, etc.                  | Objeto `vehicle` criado                                |
| `GET`  | `/`                                 | Lista todos os veículos com filtros e paginação.                            | Nenhuma        | -                                                         | Array de `vehicle`                                     |
| `GET`  | `/:id`                              | Busca um veículo pelo ID.                                                   | Nenhuma        | -                                                         | Objeto `vehicle`                                       |
| `PUT`  | `/:id`                              | Atualiza os dados de um veículo.                                            | Requerida      | `marca`, `modelo`, `anoFabricacao`, etc.                  | Objeto `vehicle` atualizado                            |
| `DELETE`| `/:id`                              | Deleta um veículo.                                                          | Requerida      | -                                                         | Mensagem de sucesso                                    |
| `GET`  | `/stats`                            | Obtém estatísticas gerais sobre os veículos.                                | Nenhuma        | -                                                         | Objeto com estatísticas                                |
| `GET`  | `/:id/details`                      | Obtém detalhes completos de um veículo.                                     | Nenhuma        | -                                                         | Objeto `vehicle` com detalhes                          |
| `GET`  | `/vendors/:vendorId`                | Lista os veículos de um vendedor específico.                                | Nenhuma        | -                                                         | Array de `vehicle`                                     |
| `POST` | `/:id/images`                       | Adiciona imagens a um veículo.                                              | Requerida      | `FormData` com os arquivos de imagem                      | Objeto `vehicle` com as novas imagens                  |
| `DELETE`| `/:id/images`                       | Deleta uma imagem de um veículo.                                            | Requerida      | `imageUrl`                                                | Mensagem de sucesso                                    |
| `POST` | `/:id/videos`                       | Adiciona um vídeo a um veículo.                                             | Requerida      | `FormData` com o arquivo de vídeo                         | Objeto `vehicle` com o novo vídeo                      |
| `POST` | `/:id/favorites`                    | Adiciona um veículo aos favoritos do usuário.                               | Requerida      | -                                                         | Mensagem de sucesso                                    |
| `DELETE`| `/:id/favorites`                    | Remove um veículo dos favoritos do usuário.                                 | Requerida      | -                                                         | Mensagem de sucesso                                    |
| `GET`  | `/me/favorites`                     | Lista os veículos favoritos do usuário logado.                              | Requerida      | -                                                         | Array de `vehicle`                                     |
| `POST` | `/:id/reviews`                      | Cria uma avaliação para um veículo.                                         | Requerida      | `rating`, `comentario`                                    | Objeto `review` criado                                 |
| `GET`  | `/:id/reviews`                      | Lista as avaliações de um veículo.                                          | Nenhuma        | -                                                         | Array de `review`                                      |
| `PUT`  | `/reviews/:reviewId`                | Atualiza uma avaliação.                                                     | Requerida      | `rating`, `comentario`                                    | Objeto `review` atualizado                             |
| `DELETE`| `/reviews/:reviewId`                | Deleta uma avaliação.                                                       | Requerida      | -                                                         | Mensagem de sucesso                                    |

### 💬 Negociações (`/api/negotiations`)

| Método | Rota                                | Descrição                                                                 | Autenticação | Corpo da Requisição (Body)                               | Resposta (Sucesso)                                     |
| :----- | :---------------------------------- | :-------------------------------------------------------------------------- | :------------- | :-------------------------------------------------------- | :----------------------------------------------------- |
| `POST` | `/`                                 | Inicia uma nova negociação para um veículo.                                 | Requerida      | `vehicleId`, `precoOfertado`                              | Objeto `negotiation` criado                            |
| `GET`  | `/user`                             | Lista todas as negociações do usuário logado.                               | Requerida      | -                                                         | Array de `negotiation`                                 |
| `GET`  | `/:negotiationId`                   | Obtém os detalhes de uma negociação específica.                             | Requerida      | -                                                         | Objeto `negotiation` com detalhes e mensagens          |
| `GET`  | `/:negotiationId/history`           | Obtém o histórico de uma negociação.                                        | Requerida      | -                                                         | Array com o histórico de `mensage`                     |
| `POST` | `/:negotiationId`                   | Adiciona uma nova mensagem à negociação.                                    | Requerida      | `conteudo`                                                | Objeto `mensage` criado                                |
| `PUT`  | `/:negotiationId/respond`           | Responde a uma negociação (aceita, recusa ou faz contraproposta).           | Requerida      | `status` (`ACEITA`, `RECUSADA`, `CONTRA_OFERTA`), `precoNegociado` (opcional) | Objeto `negotiation` atualizado                        |
| `DELETE`| `/:negotiationId`                   | Cancela uma negociação.                                                     | Requerida      | -                                                         | Mensagem de sucesso                                    |

### 💰 Vendas (`/api/sales`)

| Método | Rota                                | Descrição                                                                 | Autenticação | Corpo da Requisição (Body)                               | Resposta (Sucesso)                                     |
| :----- | :---------------------------------- | :-------------------------------------------------------------------------- | :------------- | :-------------------------------------------------------- | :----------------------------------------------------- |
| `POST` | `/`                                 | Registra uma nova venda.                                                    | Requerida      | `vehicleId`, `compradorId`, `precoVenda`, `formaPagamento` | Objeto `sale` criado                                   |
| `GET`  | `/:id`                              | Busca uma venda pelo ID.                                                    | Requerida      | -                                                         | Objeto `sale`                                          |
| `PUT`  | `/:id`                              | Atualiza os dados de uma venda.                                             | Requerida      | `formaPagamento`, `observacoes`, etc.                     | Objeto `sale` atualizado                               |
| `GET`  | `/stats`                            | Obtém estatísticas gerais de vendas.                                        | Requerida      | -                                                         | Objeto com estatísticas                                |
| `GET`  | `/vehicles/:vehicleId`              | Lista as vendas de um veículo específico.                                   | Requerida      | -                                                         | Array de `sale`                                        |
| `GET`  | `/:userId/stats`                    | Obtém as estatísticas de vendas de um usuário.                              | Requerida      | -                                                         | Objeto com estatísticas                                |
| `GET`  | `/:userId/history`                  | Obtém o histórico de vendas de um usuário.                                  | Requerida      | -                                                         | Array de `sale`                                        |
| `GET`  | `/transactions/:userId`             | Obtém as transações de um usuário.                                          | Requerida      | -                                                         | Array de `sale`                                        |
| `GET`  | `/buyers/:userId`                   | Lista as compras de um usuário.                                             | Requerida      | -                                                         | Array de `sale`                                        |
| `GET`  | `/sellers/:userId`                  | Lista as vendas de um usuário como vendedor.                                | Requerida      | -                                                         | Array de `sale`                                        |

---

## 🏛️ Arquitetura do Projeto

O projeto segue uma arquitetura modular, com as responsabilidades bem divididas:

*   **`src/config`:** Arquivos de configuração (banco de dados, multer, nodemailer).
*   **`src/constants`:** Constantes e enums utilizados na aplicação.
*   **`src/middleware`:** Middlewares customizados para autenticação, tratamento de erros, etc.
*   **`src/modules`:** Onde a lógica de negócio de cada módulo (usuários, veículos, etc.) está implementada.
*   **`src/routes`:** Definição das rotas da API.
*   **`src/utils`:** Funções utilitárias.
*   **`prisma`:** Schema do banco de dados e arquivos de migração.

---

## 📝 Licença

Este projeto está sob a licença ISC.
