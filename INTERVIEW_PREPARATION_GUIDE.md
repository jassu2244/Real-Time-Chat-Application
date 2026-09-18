# 🚀 Full-Stack Real-Time Chat Application: Complete Interview Preparation Guide

This guide covers in-depth technical explanations and interview answers for the Real-Time Chat Application built with **Spring Boot 3, WebSocket (STOMP), Spring Security (JWT), Spring Data JPA, and React/Vite**.

---

# 🔴 MUST KNOW (Top Priority)

---

### 1. Overall Architecture of the Real-Time Chat Application

#### Architecture Diagram & Flow

```
+-------------------------------------------------------------------+
|                        Client Layer (React / Vite)                |
|  - Axios (REST API / Auth)         - StompJS / SockJS (WebSocket) |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               Spring Boot 3 Backend Server (Port 8080)             |
|                                                                   |
|  [ HTTP Request Path ]                 [ WebSocket / STOMP Path ] |
|   1. CORS Filter                        1. Handshake: /ws (SockJS)|
|   2. JwtAuthenticationFilter            2. Simple In-Memory Broker|
|   3. SecurityFilterChain                   - /topic (Public Chat) |
|   4. RestControllers:                      - /queue, /user (Priv) |
|      - AuthController                   3. ChatController         |
|      - UserController                      - @MessageMapping      |
|      - MessageController                4. WebSocketListener      |
|                                            - Connect / Disconnect |
|                                                                   |
|  [ Business Logic Layer ]                                         |
|   - AuthenticationService, UserService, CustomUserDetailService  |
|   - JwtService (Token generation, claims, signing)                |
|                                                                   |
|  [ Persistence Layer (Spring Data JPA / Hibernate) ]              |
|   - UserRepository, ChatMessageRepository                         |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                        Database Layer                             |
|               MySQL / H2 (Relational Database)                    |
|               - users table                                       |
|               - chat_messages table                               |
+-------------------------------------------------------------------+
```

#### Key Architectural Pillars:

1. **Dual Communication Protocol**:
   - **HTTP (REST API)**: Used for stateless operations like user registration, login, logout, profile retrieval, and loading chat history.
   - **WebSocket + STOMP**: A persistent, bidirectional, full-duplex TCP connection used for instant message delivery and real-time user presence tracking (online/offline).
2. **Stateless Security**: Spring Security configured with `SessionCreationPolicy.STATELESS`. Every incoming HTTP request is authenticated via a signed JSON Web Token (JWT).
3. **Decoupled Messaging**: The STOMP message broker routes messages to dedicated destinations (`/topic/public` for broadcast, `/user/{username}/queue/private` for 1-on-1 private messaging).

---

### 2. End-to-End JWT Authentication Flow

#### End-to-End Workflow:

1. **Registration**: User submits username, email, and password. Password is encrypted using `BCryptPasswordEncoder` and stored in the database.
2. **Login (`POST /api/auth/login`)**:
   - `AuthenticationService` validates credentials using `AuthenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user, pass))`.
   - On success, `JwtService.generateToken(user)` creates a signed token containing:
     - **Subject**: `username`
     - **Custom Claims**: `userId`
     - **Issued At**: Current timestamp
     - **Expiration**: Expiry duration (e.g., 24 hours)
     - **Signature**: Signed with HMAC-SHA-256 using a secure secret key.
   - The token is placed into a secure **HttpOnly Cookie** (`JWT=<token>`) and returned in the HTTP response.
3. **Subsequent API Requests**:
   - The browser automatically attaches the cookie (or the client sends `Authorization: Bearer <token>`).
   - `JwtAuthenticationFilter` intercepts the request, extracts the token, verifies the cryptographic signature, checks expiration, and extracts `userId`.
   - The user is loaded from `UserRepository`, and a `UsernamePasswordAuthenticationToken` is placed in `SecurityContextHolder.getContext().setAuthentication(authToken)`.
4. **Execution**: The Controller handles the request for the authenticated user. Once the request finishes, the `SecurityContext` is cleared for that thread.

---

### 3. Difference Between `@GetMapping` and `@MessageMapping`

| Feature                   | `@GetMapping` (REST HTTP)                                                     | `@MessageMapping` (WebSocket / STOMP)                                                  |
| :------------------------ | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Protocol**              | HTTP / HTTPS (Request-Response model)                                         | WebSocket (Persistent, full-duplex TCP frame)                                          |
| **Connection Lifecycle**  | Short-lived (Connection opens, sends request, gets response, closes or pools) | Long-lived (Connection stays open continuously)                                        |
| **Overhead**              | High HTTP headers sent on every request                                       | Minimal (Tiny STOMP text frame payloads)                                               |
| **Routing / Destination** | Matches HTTP URL path (e.g., `/api/messages/public`)                          | Matches STOMP destination prefix (e.g., `/app/chat.sendMessage`)                       |
| **Broadcasting**          | Cannot push to other clients without polling/SSE                              | Can directly push to thousands of subscribers via `@SendTo` or `SimpMessagingTemplate` |
| **Primary Use Case**      | Fetching historical messages, user profiles, login/logout                     | Sending real-time messages, typing indicators, user join/leave alerts                  |

---

### 4. How Private Messages are Routed to a Specific User in STOMP

#### Implementation Breakdown:

1. **Destination Configuration**:
   In `WebSocketConfig.java`:
   ```java
   config.enableSimpleBroker("/topic", "/queue", "/user");
   config.setUserDestinationPrefix("/user");
   ```
2. **Client Subscription**:
   When User A ("Jasmeet") connects, they subscribe to their unique queue:
   ```javascript
   stompClient.subscribe(`/user/${currentUsername}/queue/private`, onMessageReceived);
   ```
3. **Message Transmission**:
   When User A sends a private message to User B ("Rahul"), they send a frame to `/app/chat.sendPrivateMessage`.
4. **Server Routing in `ChatController.java`**:

   ```java
   // Save to database
   chatMessage.setMessageType(MessageType.PRIVATE_MESSAGE);
   ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

   // 1. Deliver to Receiver
   String receiverDestination = "/user/" + chatMessage.getReceiver() + "/queue/private";
   messagingTemplate.convertAndSend(receiverDestination, savedMessage);

   // 2. Echo back to Sender (so sender UI syncs across devices)
   String senderDestination = "/user/" + chatMessage.getSender() + "/queue/private";
   messagingTemplate.convertAndSend(senderDestination, savedMessage);
   ```

5. **How STOMP User Destination Works Under the Hood**:
   Spring translates `/user/{username}/queue/private` by resolving the destination associated with the user's active session and delivering the frame only to that client's subscribed channel.

---

### 5. Where the JWT Token is Stored on Login

In this project, the JWT token is sent back as an **HttpOnly Cookie**:

```java
ResponseCookie responseCookie = ResponseCookie.from("JWT", loginResponseDTO.getToken())
        .httpOnly(true)    // Inaccessible to JavaScript (XSS Protection)
        .secure(false)     // Set to true in production for HTTPS
        .sameSite("Lax")   // CSRF Mitigation
        .path("/")
        .maxAge(60 * 60)   // 1 hour expiry
        .build();
```

#### Comparison of Storage Locations:

| Storage Option                        | Vulnerability to XSS                                                                                   | Vulnerability to CSRF                                   | Best Practice Recommendation                       |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------ | :------------------------------------------------- |
| **`localStorage` / `sessionStorage`** | **Vulnerable** (Any injected JS script can read `localStorage.getItem('token')` and steal credentials) | **Immune** (Not automatically sent by browser)          | ❌ Insecure for sensitive authentication tokens    |
| **HttpOnly Cookie**                   | **Protected** (JavaScript `document.cookie` cannot access HttpOnly cookies)                            | Requires `SameSite=Strict/Lax` or CSRF token protection | ✅ **Industry Standard** for web apps              |
| **In-Memory Variable (JS State)**     | **Protected** (Lost on refresh unless refreshed via HttpOnly Refresh Token)                            | **Immune**                                              | ✅ Excellent when paired with Silent Token Refresh |

---

### 6. Database Schema and Entity Design

The database contains two core entities: `users` and `chat_messages`.

```
+---------------------------------+           +---------------------------------+
|              users              |           |          chat_messages          |
+---------------------------------+           +---------------------------------+
| PK  id          BIGINT (AUTO)   |           | PK  id           BIGINT (AUTO)  |
|     username    VARCHAR (UNIQUE)|           |     content      VARCHAR        |
|     email       VARCHAR (UNIQUE)|           |     sender       VARCHAR        |
|     password    VARCHAR (BCRYPT)|           |     receiver     VARCHAR (NULL) |
|     is_online   BOOLEAN         |           |     color        VARCHAR        |
|     role        VARCHAR (ENUM)  |           |     time_stamp   DATETIME       |
+---------------------------------+           |     message_type VARCHAR (ENUM) |
                                              +---------------------------------+
```

#### Enums:

- `Role`: `ROLE_USER`, `ROLE_ADMIN`
- `MessageType`: `CHAT` (Public broadcast), `JOIN` (User entered), `LEAVE` (User disconnected), `PRIVATE_MESSAGE` (Direct 1-on-1)

#### Entity Features:

- **`User`**: Implements Spring Security's `UserDetails`, allowing seamless integration with `AuthenticationManager` and `SecurityContextHolder`.
- **`ChatMessage`**: Stores message contents, sender/receiver usernames, timestamps, and message types for historical retrieval.

---

### 7. How `JwtAuthenticationFilter` Integrates into Spring Security

1. **Class Hierarchy**: Extends `OncePerRequestFilter`, guaranteeing execution exactly once per HTTP request dispatch.
2. **Order of Execution in `SecurityConfig.java`**:
   ```java
   .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
   ```
   This ensures the custom JWT filter intercepts requests **before** Spring Security's default username/password authentication mechanism.
3. **Internal Logic (`doFilterInternal`)**:

   ```java
   // 1. Extract Token from Authorization header OR HttpOnly cookie
   String jwtToken = extractToken(request);

   // 2. Validate token and check if SecurityContext is already authenticated
   if (jwtToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
       Long userId = jwtService.extractUserId(jwtToken);
       User userDetails = userRepository.findById(userId).orElseThrow();

       if (jwtService.isTokenValid(jwtToken, userDetails)) {
           // 3. Create Authentication Token with authorities
           UsernamePasswordAuthenticationToken authToken =
               new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
           authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

           // 4. Set the Security Context for current request thread
           SecurityContextHolder.getContext().setAuthentication(authToken);
       }
   }
   // 5. Proceed to next filter in chain
   filterChain.doFilter(request, response);
   ```

---

### 8. Role of `WebSocketConfig`

`WebSocketConfig` implements `WebSocketMessageBrokerConfigurer` and coordinates real-time messaging:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker destinations that clients subscribe to
        config.enableSimpleBroker("/topic", "/queue", "/user");

        // Prefix for destinations routed to @MessageMapping controller methods
        config.setApplicationDestinationPrefixes("/app");

        // Prefix used for private 1-to-1 messaging
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The initial HTTP handshake endpoint to establish WebSocket connection
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .withSockJS(); // Fallback for browsers without native WebSocket
    }
}
```

- **SockJS**: Provides fallback transports (XHR Streaming, Long Polling) if WebSockets are blocked by corporate firewalls or older proxies.
- **STOMP (Simple Text Oriented Messaging Protocol)**: Provides message format standards (Commands: `CONNECT`, `SUBSCRIBE`, `SEND`, `MESSAGE`).

---

### 9. Secure Password Storage with BCrypt

#### Why Plaintext or MD5/SHA-256 is Insecure:

Simple hashes (like MD5 or SHA-256) are vulnerable to **Rainbow Table attacks** and high-speed GPU-based brute-force attacks (billions of hashes/sec).

#### How BCrypt Works in the Application:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(); // Default strength = 10 rounds
}
```

1. **Cryptographic Salt**: Generates a random 128-bit salt per user. Even if two users share the same password (`password123`), their stored hashes will look completely different.
2. **Adaptive Cost Factor (Work Factor)**: Uses key-stretching iterations ($2^{10} = 1024$ rounds). This deliberately slows down computation to defend against brute force.
3. **Verification**: `passwordEncoder.matches(rawPassword, encodedPassword)` extracts the salt from the stored hash, re-computes the hash with the provided raw password, and checks equality.

---

### 10. What Happens When a User Logs Out

1. **HTTP Cookie Invalidation**:
   In `AuthenticationService.java`:
   ```java
   ResponseCookie responseCookie = ResponseCookie.from("JWT", "")
           .httpOnly(true)
           .secure(true)
           .path("/")
           .maxAge(0) // Instantly deletes the cookie on the browser
           .sameSite("Strict")
           .build();
   ```
2. **WebSocket Disconnect & Presence Update**:
   - The frontend calls `stompClient.disconnect()`.
   - Spring triggers `SessionDisconnectEvent`.
   - `WebSocketListener` handles the event:
     - Sets `user.setOnline(false)` in the database.
     - Broadcasts a `LEAVE` message to `/topic/public`:
       ```java
       ChatMessage chatMessage = new ChatMessage();
       chatMessage.setMessageType(MessageType.LEAVE);
       chatMessage.setSender(username);
       messagingTemplate.convertAndSend("/topic/public", chatMessage);
       ```
3. **Client-Side Cleanup**: Clears user state, terminates active subscriptions, and redirects to the login view.

---

# 🟠 SHOULD KNOW (High Priority)

---

### 1. Java/OOP: Interface vs Abstract Class & Optional

#### Interface vs Abstract Class:

| Criteria                 | Interface                                                     | Abstract Class                                                      |
| :----------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------ |
| **Multiple Inheritance** | A class can implement multiple interfaces (`implements A, B`) | A class can only extend one abstract class (`extends SingleParent`) |
| **State / Fields**       | Only `public static final` constants (no instance state)      | Can have instance variables with various access modifiers           |
| **Constructors**         | Cannot have constructors                                      | Can have constructors called by subclasses via `super()`            |
| **Method Types**         | Abstract, `default`, and `static` methods                     | Abstract and fully implemented concrete methods                     |
| **Core Intent**          | Defines a contract / capability (_"What it can do"_)          | Defines a base identity / code template (_"What it is"_)            |

#### How `Optional<T>` Prevents `NullPointerException`:

In Spring Data JPA (e.g., `userRepository.findByUsername(username)`):

- Instead of returning `null` when a record is missing, it returns `Optional.empty()`.
- It forces the developer to explicitly handle absence:
  ```java
  User user = userRepository.findByUsername(username)
          .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
  ```
- This eliminates unexpected `NullPointerException` at runtime.

---

### 2. Java/OOP: Java Stream API Usage in `UserController`

In `UserController.java`:

```java
@GetMapping("/online")
public ResponseEntity<List<UserDTO>> getOnlineUsers() {
    List<User> onlineUsers = userRepository.findByIsOnlineTrue();
    List<UserDTO> onlineUserDTOs = onlineUsers.stream()
            .map(authenticationService::convertToDTO)
            .collect(Collectors.toList());
    return ResponseEntity.ok(onlineUserDTOs);
}
```

#### Step-by-Step Breakdown:

1. **`.stream()`**: Converts the `List<User>` into a declarative pipeline of data elements.
2. **`.map(authenticationService::convertToDTO)`**: An intermediate transformation operation that applies a mapping function to each `User` object, converting it into a `UserDTO` (hiding sensitive fields like passwords). Uses a **method reference** (`Class::method`).
3. **`.collect(Collectors.toList())`**: A terminal operation that accumulates the transformed elements into a new immutable/mutable `List<UserDTO>`.

---

### 3. Spring Boot: Dependency Injection & `@RequiredArgsConstructor`

#### Dependency Injection (DI):

A design pattern where the Spring IoC (Inversion of Control) container creates and injects dependent objects into a class rather than the class instantiating them directly with `new`.

#### Why Constructor Injection with `@RequiredArgsConstructor` (Lombok) is Best Practice:

```java
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    // ...
}
```

1. **Immutability**: Dependencies are marked `final`, preventing re-assignment after object construction.
2. **Prevents Circular Dependencies & Partial Initialization**: All required beans must exist at instantiation time.
3. **Easy Unit Testing**: Enables mocking without needing reflection or Spring container startup (`new AuthenticationService(mockRepo, mockEncoder, ...)`).
4. **Superior to Field Injection (`@Autowired`)**: Avoids hidden dependencies and tightly coupled code.

---

### 4. Spring Boot: Difference Between `@Component`, `@Service`, and `@Repository`

All three are **Stereotype Annotations** inheriting from `@Component`:

```
                  @Component (Generic Spring Bean)
                  /         \                 \
        @Service            @Repository       @Controller / @RestController
 (Business Logic Layer)   (Data Access Layer)      (Presentation Layer)
```

1. **`@Component`**: General-purpose Spring-managed bean (e.g., `JwtAuthenticationFilter`, `WebSocketListener`).
2. **`@Service`**: Semantic marker for the business logic and orchestration layer (e.g., `AuthenticationService`, `UserService`).
3. **`@Repository`**: Specific to the Data Access Layer (DAO / JPA). Automatically enables Spring's **Platform Exception Translation**, converting vendor-specific SQL exceptions (like `SQLException`, `HibernateException`) into Spring's unified `DataAccessException` hierarchy.

---

### 5. Spring Boot: How `@Transactional` Manages Database Transactions

#### How it Works Under the Hood:

1. **Spring AOP Proxy**: When a method with `@Transactional` is invoked, Spring intercepts the call using a dynamic CGLIB/JDK proxy.
2. **Connection Binding**: The proxy opens a database transaction and binds the DB connection to the current thread via `ThreadLocal`.
3. **Commit / Rollback Policy**:
   - If the method completes without exceptions, the proxy calls `connection.commit()`.
   - If an **unchecked exception** (`RuntimeException` or `Error`) is thrown, the proxy automatically calls `connection.rollback()`.
   - Checked exceptions do not trigger rollback by default unless explicitly configured: `@Transactional(rollbackFor = Exception.class)`.

---

### 6. SQL/DBMS: Difference Between `WHERE` and `HAVING`

| Clause                  | `WHERE`                                                                    | `HAVING`                                                           |
| :---------------------- | :------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **Execution Timing**    | Filters individual rows **before** any grouping or aggregation occurs      | Filters grouped records **after** `GROUP BY` and aggregations      |
| **Aggregate Functions** | **Cannot** use aggregate functions (e.g., `WHERE COUNT(*) > 5` is invalid) | **Can** use aggregate functions (e.g., `HAVING COUNT(cm.id) > 10`) |
| **Usage Context**       | Can be used without `GROUP BY`                                             | Almost always used in conjunction with `GROUP BY`                  |

#### Example Query:

```sql
-- Find users who have sent more than 50 private messages in the last 7 days
SELECT sender, COUNT(*) AS message_count
FROM chat_messages
WHERE message_type = 'PRIVATE_MESSAGE' AND time_stamp >= NOW() - INTERVAL 7 DAY  -- Row Filter
GROUP BY sender
HAVING COUNT(*) > 50;                                                           -- Group Filter
```

---

### 7. SQL/DBMS: `INNER JOIN` vs `LEFT JOIN` (Messages & Users)

```
        INNER JOIN                              LEFT JOIN
   +--------+--------+                    +--------+--------+
   | Users  |Messages|                    | Users  |Messages|
   |   (    |*|    ) |                    | (******|*|    ) |
   +--------+--------+                    +--------+--------+
Only users who sent messages              All users, with message data
                                          (or NULL if no messages sent)
```

1. **`INNER JOIN`**: Returns records that have matching values in **both** tables.
   ```sql
   -- Returns only users who have sent at least one message
   SELECT u.username, cm.content, cm.time_stamp
   FROM users u
   INNER JOIN chat_messages cm ON u.username = cm.sender;
   ```
2. **`LEFT JOIN` (LEFT OUTER JOIN)**: Returns **all** records from the left table (`users`), and matching records from the right table (`chat_messages`). If no match exists, NULL values are returned for right-side columns.
   ```sql
   -- Returns ALL users, showing message count (even 0 for inactive users)
   SELECT u.username, COUNT(cm.id) AS total_messages
   FROM users u
   LEFT JOIN chat_messages cm ON u.username = cm.sender
   GROUP BY u.username;
   ```

---

### 8. SQL/DBMS: Recommended Indexes to Optimize Message Retrieval

In `ChatMessageRepository.java`, we execute queries like:

- `findPrivateMessagesBetweenTwoUsers(user1, user2)`
- `findTop50ByMessageTypeOrderByTimeStampDesc(CHAT)`

#### Optimal Indexes:

1. **Composite Index for Private Messaging**:
   ```sql
   CREATE INDEX idx_chat_private ON chat_messages (sender, receiver, time_stamp ASC);
   CREATE INDEX idx_chat_receiver ON chat_messages (receiver, sender, time_stamp ASC);
   ```
   _Why_: Speeds up range scans when looking for messages where `sender=A AND receiver=B` ordered chronologically.
2. **Composite Index for Public Chat Feeds**:
   ```sql
   CREATE INDEX idx_chat_type_timestamp ON chat_messages (message_type, time_stamp DESC);
   ```
   _Why_: Prevents full-table scans when fetching the latest 50 public messages (`WHERE message_type = 'CHAT' ORDER BY time_stamp DESC LIMIT 50`).

---

### 9. DSA: Rate Limiter Implementation (Token Bucket & Sliding Window)

To prevent spam attacks on the chat server, rate limiting is essential:

#### A. Token Bucket Algorithm:

- A bucket has a maximum capacity $C$ (e.g., 10 tokens) and refills at a constant rate $r$ (e.g., 2 tokens/sec).
- Each message requires 1 token. If tokens are available, the message is sent and a token is consumed. If empty, the request is rejected (`429 Too Many Requests`).
- _Advantage_: Handles short bursts gracefully while maintaining a strict average rate.

#### B. Sliding Window Log Algorithm (with Redis):

1. For each user message, store the timestamp in a Redis Sorted Set (`ZSET`): `Key = "rate_limit:" + userId`.
2. Remove all entries older than the current window ($t - \text{windowSize}$):
   `ZREMRANGEBYSCORE rate_limit:user123 0 (now - 60s)`
3. Get the count of remaining elements: `ZCARD rate_limit:user123`.
4. If count $< \text{limit}$, allow the message and add current timestamp: `ZADD rate_limit:user123 now now`. Otherwise, drop the message.

---

### 10. DSA: Best In-Memory Data Structure for Recent Chat Messages

#### Best Choices:

1. **Circular Buffer / Ring Buffer (Array-based)**:
   - Fixed size $N$ (e.g., last 50 messages).
   - Write pointer wraps around when the capacity is reached, overwriting the oldest message.
   - **Time Complexity**: $O(1)$ insertions, $O(1)$ updates, $O(K)$ reads.
   - **Space Complexity**: Fixed memory footprint $O(N)$, zero garbage collection overhead from dynamic re-allocations.
2. **`ArrayDeque` (Double-ended Queue)**:
   - When size exceeds 50, call `deque.removeFirst()` and `deque.addLast(newMessage)`.
   - **Time Complexity**: Amortized $O(1)$ operations.

---

# 🟡 NICE TO KNOW (Bonus Edge)

---

### 1. System Design: Scaling to 100,000 Concurrent WebSocket Connections

```
                         +-----------------------------+
                         |      DNS / Cloudflare       |
                         +--------------+--------------+
                                        |
                                        v
                         +-----------------------------+
                         | AWS Application Load Balancer|
                         |  (WebSocket Upgrade & WAF)  |
                         +-------+------+-------+------+
                                 |      |       |
         +-----------------------+      |       +-----------------------+
         |                              |                               |
         v                              v                               v
+------------------+          +------------------+          +------------------+
| Backend Node 1   |          | Backend Node 2   |          | Backend Node N   |
| (Spring Boot /   |          | (Spring Boot /   |          | (Spring Boot /   |
|  Netty Server)   |          |  Netty Server)   |          |  Netty Server)   |
+--------+---------+          +--------+---------+          +--------+---------+
         |                              |                               |
         +------------------------------+-------------------------------+
                                        |
                                        v
                         +-----------------------------+
                         |  Redis Pub/Sub / RabbitMQ   |
                         |  (Distributed Message Broker|
                         +-----------------------------+
```

#### Core Architecture Strategies:

1. **I/O Model & Server Engine**:
   - Standard Tomcat thread-per-connection caps out around 5k-10k connections due to memory and context-switching overhead.
   - Switch to **Spring WebFlux with Netty** (non-blocking event-loop architecture) to manage tens of thousands of idle connections per node with low RAM usage.
2. **OS / Kernel Tuning**:
   - Increase open file descriptor limits: `ulimit -n 1000000`.
   - Tune TCP buffer sizes and epoll limits (`net.core.somaxconn = 65535`).
3. **Cross-Node Message Distribution via Redis Pub/Sub**:
   - If User A is connected to Node 1 and User B is connected to Node 2, Node 1 publishes the message to Redis.
   - All server nodes subscribe to Redis channels and forward the message to their local connected client sockets.

---

### 2. System Design: Message Delivery Guarantees

| Strategy                        | Mechanism                                                                                                                                                              | Trade-Offs                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **At-most-once**                | Fire-and-forget message over WebSocket.                                                                                                                                | Zero retry overhead, but messages can be lost during network disconnects.       |
| **At-least-once** (Recommended) | 1. Client assigns a UUID `clientMessageId`.<br>2. Server saves to DB and returns an `ACK` frame.<br>3. If client doesn't receive `ACK` in 3s, it retries sending.      | Guarantees no data loss, but duplicate messages may arrive if ACKs are dropped. |
| **Exactly-once**                | Combines **At-least-once** with server-side and client-side **Deduplication / Idempotency Keys**.<br>The database enforces a unique constraint on `client_message_id`. | Higher complexity and database write checks, but perfect consistency.           |

---

### 3. HR / Technical Challenge Scenario: Debugging a Real Bug

> **Question**: _"Tell me about a difficult bug you faced in this project and how you resolved it."_

#### Answer Template:

> _"While testing multi-user presence, I noticed that when a user closed their browser tab, their status remained 'Online' indefinitely in the database, causing phantom active users._
>
> _I investigated the application lifecycle and found two issues:_
>
> 1. _In `WebSocketListener.java`, the disconnect handler method `handleWebSocketDisconnectListener` was missing Spring's `@EventListener` annotation, preventing Spring's event publisher from invoking the handler during `SessionDisconnectEvent`._
> 2. _Additionally, across different origin ports (Vite on `5173` and Spring Boot on `8080`), browser cookie transmission was failing because `SameSite` was set to `Strict` without matching CORS credentials headers (`allowCredentials(true)`)._
>
> _I resolved this by adding the missing `@EventListener`, configuring `SameSite=Lax` on the JWT response cookie, and writing integration tests to verify automated status transitions."_

---

### 4. HR / Leadership: Prioritizing Security vs Developer Velocity

> **Question**: _"How do you balance application security with the need to ship features quickly?"_

#### Answer Template:

> _"I follow a **'Shift-Left' Security and Defense-in-Depth** philosophy rather than treating security as an afterthought._
>
> 1. **Automate the Baseline**: Integrate security into the developer workflow from day one using tools like SonarQube, Dependabot, and proper Spring Security defaults (e.g., BCrypt, HttpOnly cookies, CORS whitelisting). This adds zero friction to daily velocity.
> 2. **Risk-Based Prioritization**: Core security controls (Authentication, Authorization, Data Sanitization, Password Hashing) are **non-negotiable blockers**.
> 3. **Iterative Hardening**: Advanced enhancements (e.g., distributed rate limiters, multi-region failover, mTLS) can be deployed iteratively based on scale and threat model milestones."\*

---
