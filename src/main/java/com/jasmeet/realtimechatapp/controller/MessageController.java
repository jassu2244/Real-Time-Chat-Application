package com.jasmeet.realtimechatapp.controller;

import com.jasmeet.realtimechatapp.miscellaneous.MessageType;
import com.jasmeet.realtimechatapp.model.ChatMessage;
import com.jasmeet.realtimechatapp.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final ChatMessageRepository chatMessageRepository;

    @GetMapping("/private")
    public ResponseEntity<List<ChatMessage>> getPrivateMessages(@RequestParam String user1,
                                                                @RequestParam String user2) {
        List<ChatMessage> messages = chatMessageRepository.findPrivateMessagesBetweenTwoUsers(user1, user2);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/public")
    public ResponseEntity<List<ChatMessage>> getPublicMessages() {
        List<ChatMessage> messages = chatMessageRepository.findByMessageTypeOrderByTimeStampAsc(MessageType.CHAT);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ChatMessage>> getRecentMessages(@RequestParam(defaultValue = "50") int limit) {
        List<ChatMessage> messages = chatMessageRepository.findTop50ByMessageTypeOrderByTimeStampDesc(MessageType.CHAT);
        return ResponseEntity.ok(messages);
    }
}
