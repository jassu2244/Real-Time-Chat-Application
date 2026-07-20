package com.jasmeet.realtimechatapp.listener;

import com.jasmeet.realtimechatapp.miscellaneous.MessageType;
import com.jasmeet.realtimechatapp.model.ChatMessage;
import com.jasmeet.realtimechatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketListener {
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(WebSocketListener.class);

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Connected to web socket");
    }

    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = accessor.getSessionAttributes().get("username").toString();
        userService.setUserOnlineStatus(username, false);

        System.out.println("User disconnected from web socket");
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setMessageType(MessageType.LEAVE);
        chatMessage.setSender(username);
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}
