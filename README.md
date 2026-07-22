# Real-Time Chat Application

A full-stack, real-time messaging application built with **Spring Boot** (Java 21) on the backend and **React + Vite** on the frontend. The application supports real-time public group messaging, direct one-on-one private messaging, user online status tracking, and secure JWT-based authentication stored in HTTP-only cookies.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture & Structure](#project-architecture--structure)
- [Prerequisites](#prerequisites)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Installation & Setup](#installation--setup)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [API Reference](#api-reference)
  - [Authentication Endpoints](#authentication-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Message Endpoints](#message-endpoints)
- [WebSocket Destinations & STOMP Messaging](#websocket-destinations--stomp-messaging)
- [License](#license)

---

## Features

- **Authentication & Security**
  - User registration and login using Spring Security and BCrypt password encoding.
  - JWT (JSON Web Token) generation with secure HTTP-only cookie distribution.
  - Auth state persistence and session management.

- **Real-Time Messaging (STOMP / SockJS)**
  - **Public Room Chat**: Broadcast messages to all connected participants instantly.
  - **Private Messaging**: One-on-one direct chat routed via user-specific WebSocket queues.
  - **Join & Leave Notifications**: Broadcasts event messages when users join or disconnect.

- **User Presence & Status**
  - Automatic online status detection (`isOnline`) using Spring WebSocket session listeners (`SessionConnectEvent` / `SessionDisconnectEvent`).
  - Active user listing and status indicators in the UI.

- **Message History**
  - Persistent message storage in MySQL/H2 using Spring Data JPA.
  - Fetching historical private message logs between specific users.
  - Fetching recent public room chat logs.

---

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.6 (Java 21)
- **Security**: Spring Security, JWT (`io.jsonwebtoken:jjwt-api:0.13.0`)
- **Real-time Messaging**: Spring WebSocket, STOMP Broker, SockJS
- **Database / ORM**: Spring Data JPA, Hibernate, MySQL Connector, H2 Database (for testing)
- **Utilities**: Lombok, Spring Boot DevTools
- **Build Tool**: Apache Maven (`mvnw`)

### Frontend
- **Framework / Bundler**: React 18, Vite 5
- **Routing**: React Router DOM v6
- **Real-time Client**: `@stomp/stompjs`, `sockjs-client`
- **HTTP Client**: Axios (configured with `withCredentials: true`)
- **Date Formatting**: Day.js
- **Styling**: Vanilla CSS (`chat.css`)

---

## Project Architecture & Structure

```
realtimechatapp/
├── frontend/                       # React + Vite Frontend Application
│   ├── src/
│   │   ├── api/                    # Axios instance configuration (axios.js)
│   │   ├── components/             # Reusable UI components
│   │   │   ├── MessageInput.jsx    # Input bar for chat messages
│   │   │   ├── MessageList.jsx     # Chat transcript component
│   │   │   └── OnlineUsers.jsx     # Online users sidebar listing
│   │   ├── context/                # AuthContext provider & hooks
│   │   ├── pages/                  # Views (Login.jsx, Register.jsx, Chat.jsx)
│   │   ├── styles/                 # Application styles (chat.css)
│   │   ├── App.jsx                 # Routes & protected layout setup
│   │   └── main.jsx                # Vite entry point
│   ├── package.json                # Frontend dependencies & npm scripts
│   └── vite.config.js              # Vite server & backend reverse proxy config
│
├── src/                            # Spring Boot Backend Application
│   └── main/
│       ├── java/com/jasmeet/realtimechatapp/
│       │   ├── config/             # SecurityConfig, WebSocketConfig
│       │   ├── controller/         # AuthController, ChatController, MessageController, UserController
│       │   ├── dtos/               # DTOs (LoginRequestDTO, RegisterRequestDTO, UserDTO, etc.)
│       │   ├── jwt/                # JwtAuthenticationFilter, JwtService
│       │   ├── listener/           # WebSocketListener (Session connect & disconnect handling)
│       │   ├── miscellaneous/      # Enums: MessageType, Role
│       │   ├── model/              # JPA Entities: User, ChatMessage
│       │   ├── repository/         # UserRepository, ChatMessageRepository
│       │   ├── service/            # AuthenticationService, CustomUserDetailService, UserService
│       │   └── RealtimechatappApplication.java
│       └── resources/
│           └── application.yml     # App settings, DB connections, JWT secret
│
├── mvnw / mvnw.cmd                 # Maven Wrapper scripts
├── pom.xml                         # Backend dependencies & Maven config
└── README.md                       # Project documentation
```

---

## Prerequisites

Before running the application, make sure you have the following installed on your machine:

- **Java Development Kit (JDK)**: Version 21 or higher
- **Node.js**: Version 18.x or higher & `npm`
- **MySQL Server**: Version 8.0+ running on `localhost:3306`

---

## Configuration & Environment Variables

### Backend Configuration (`src/main/resources/application.yml`)

The backend connects to MySQL by default. You can configure credentials directly or pass them via environment variables:

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/RealTimeChatApp` | Database JDBC Connection URL |
| `spring.datasource.username` | `root` | Database Username |
| `spring.datasource.password` | `1234` | Database Password |
| `server.port` | `8081` | Spring Boot Server Port |
| `jwt.secretkey` | `zH5kF#nM9$aW2xS4yU7vB3jR8qL6tC1d` | Secret Key used for signing JWT tokens |
| `jwt.expiration` | `3600000` (1 hour) | JWT token lifespan in milliseconds |

### Frontend Configuration (`frontend/vite.config.js`)

The frontend runs on port `5173` and proxies requests to the Spring Boot backend:

| Environment Variable | Default Proxy Target | Description |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | `http://localhost:8081` | Target URL for `/api` and `/ws` proxying |

---

## Installation & Setup

### 1. Database Setup

Create the MySQL database named `RealTimeChatApp`:

```sql
CREATE DATABASE IF NOT EXISTS RealTimeChatApp;
```

*(Note: Hibernate will automatically create and update table schemas upon backend startup as configured by `hibernate.ddl-auto: update`)*.

---

### 2. Backend Setup

1. Open a terminal in the root directory of the project.
2. Build and run the Spring Boot application using the Maven wrapper:

   **On Windows:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   **On Linux / macOS:**
   ```bash
   chmod +x mvnw
   ./mvnw spring-boot:run
   ```

3. The backend server will start at `http://localhost:8081`.

---

### 3. Frontend Setup

1. Open a new terminal window and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the necessary Node modules:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the frontend in your browser at `http://localhost:5173`.

---

## API Reference

### Authentication Endpoints
Base Path: `/api/auth`

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/register-user` | Register a new user | `RegisterRequestDTO` (`username`, `password`, `email`, `role`) |
| `POST` | `/login` | Authenticate user & set JWT HTTP-only cookie | `LoginRequestDTO` (`username`, `password`) |
| `POST` | `/logout` | Log out user & clear JWT cookie | None |
| `GET` | `/getcurrentuser` | Retrieve profile DTO of the logged-in user | Requires authenticated session cookie |

### User Endpoints
Base Path: `/api/users`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/online` | Get list of currently online users (`isOnline: true`) |
| `GET` | `/all` | Get list of all registered users |

### Message Endpoints
Base Path: `/api/messages`

| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/public` | None | Fetch public chat room message history |
| `GET` | `/private` | `user1`, `user2` | Fetch private conversation history between two users |
| `GET` | `/recent` | `limit` (default: 50) | Fetch top N recent public messages |

---

## WebSocket Destinations & STOMP Messaging

- **WebSocket Connection Endpoint**: `/ws` (with SockJS fallback support)
- **App Prefix**: `/app`
- **Broker Prefixes**: `/topic`, `/queue`, `/user`

### Inbound STOMP Destinations (`@MessageMapping`)

| Destination | Payload | Action |
| :--- | :--- | :--- |
| `/app/chat.addUser` | `ChatMessage` | Connects user, sets `isOnline = true`, broadcasts user join to `/topic/public` |
| `/app/chat.sendMessage` | `ChatMessage` | Saves & broadcasts a public chat message to `/topic/public` |
| `/app/chat.sendPrivateMessage` | `ChatMessage` | Saves & routes private message directly to receiver and sender user queues |

### Subscribed Outbound Destinations

| Subscription Topic / Queue | Description |
| :--- | :--- |
| `/topic/public` | Receives all public group messages & join/leave notifications |
| `/user/{username}/queue/private` | Receives direct private messages addressed specifically to `{username}` |

---

## License

This project is open-source and available under standard development licensing.
