package com.jasmeet.realtimechatapp.controller;

import com.jasmeet.realtimechatapp.miscellaneous.MessageType;
import com.jasmeet.realtimechatapp.model.ChatMessage;
import com.jasmeet.realtimechatapp.repository.ChatMessageRepository;
import com.jasmeet.realtimechatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final UserService userService;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor simpMessageHeaderAccessor){
        if(userService.userExists(chatMessage.getSender())) {

            simpMessageHeaderAccessor.getSessionAttributes().put("username", chatMessage.getSender());
            userService.setUserOnlineStatus(chatMessage.getSender(), true);

            System.out.println("User Added Successfully" + chatMessage.getSender()
                    + "with session Id" + simpMessageHeaderAccessor.getSessionId());

            chatMessage.setTimeStamp(LocalDateTime.now());
            if(chatMessage.getContent() == null) {
                chatMessage.setContent("");
            }
            return chatMessageRepository.save(chatMessage);
        }
        return null;
    }
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage){
        if(userService.userExists(chatMessage.getSender())) {
            if(chatMessage.getContent() == null) {
                chatMessage.setContent("");
            }
            if(chatMessage.getTimeStamp() == null) {
                chatMessage.setTimeStamp(LocalDateTime.now());
            }
            return chatMessageRepository.save(chatMessage);
        }
        return null;
    }
    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage,  SimpMessageHeaderAccessor messageHeader){
        if(userService.userExists(chatMessage.getSender()) && userService.userExists(chatMessage.getReceiver())) {
            if(chatMessage.getContent() == null) {
                chatMessage.setContent("");
            }
            if(chatMessage.getTimeStamp() == null) {
                chatMessage.setTimeStamp(LocalDateTime.now());
            }
            chatMessage.setMessageType(MessageType.PRIVATE_MESSAGE);
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            System.out.println("Message Saved Successfully" + chatMessage.getId());

            try {
                String receiverDestination = "/user/" + chatMessage.getReceiver() + "/queue/private";
                System.out.println("Sending Message To Receiver" + receiverDestination);
                messagingTemplate.convertAndSend(receiverDestination, savedMessage);

                String senderDestination = "/user/" + chatMessage.getSender() + "/queue/private";
                System.out.println("Sending Message To Sender" + senderDestination);
                messagingTemplate.convertAndSend(senderDestination, savedMessage);
            }
            catch (Exception e) {
                System.out.println("Error Sending Message To Receiver" + e.getMessage());
                e.printStackTrace();
            }
        }
        else {
            System.out.println("Error: sender" + chatMessage.getSender() +
                    "or receiver" + chatMessage.getReceiver() + "does not exist");
        }
    }
}
