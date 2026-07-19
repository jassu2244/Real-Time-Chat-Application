package com.jasmeet.realtimechatapp.repository;

import com.jasmeet.realtimechatapp.miscellaneous.MessageType;
import com.jasmeet.realtimechatapp.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage,Long> {
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.messageType = 'PRIVATE_MESSAGE' AND" +
            "((cm.sender = :user1 AND cm.receiver = :user2) OR (cm.sender = :user2 AND cm.receiver = :user1))" +
            "ORDER BY cm.timeStamp ASC")
    List<ChatMessage> findPrivateMessagesBetweenTwoUsers(@Param("user1") String user1,
                                                         @Param("user2") String user2);

    List<ChatMessage> findByMessageTypeOrderByTimeStampAsc(MessageType messageType);

    List<ChatMessage> findTop50ByMessageTypeOrderByTimeStampDesc(MessageType messageType);

    @Query("SELECT m FROM ChatMessage m WHERE m.messageType = 'CHAT' ORDER BY m.timeStamp DESC")
    List<ChatMessage> findRecentPublicMessages();
}
