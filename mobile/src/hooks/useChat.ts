import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../api/client';
import { getSocket } from '../socket/socketClient';
import { Message, MessageNew, MessageSent, MessageError } from '../types';

export function useChat(conversationId: string | null, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    apiClient
      .get<Message[]>(`/conversations/${conversationId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (data: MessageNew) => {
      if (data.conversationId !== conversationId && conversationId !== null) return;
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          conversation_id: data.conversationId,
          sender_id: data.senderId,
          content: data.content,
          read_at: null,
          created_at: data.createdAt,
          status: 'sent' as const,
        },
      ]);
    };

    const handleSent = (data: MessageSent) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === data.tempId
            ? { ...m, id: data.id, conversation_id: data.conversationId, created_at: data.createdAt, status: 'sent' as const, tempId: undefined }
            : m
        )
      );
    };

    const handleError = (data: MessageError) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === data.tempId ? { ...m, status: 'failed' as const } : m))
      );
    };

    const handleDisconnect = () => setDisconnected(true);
    const handleConnect = () => setDisconnected(false);

    socket.on('message:new', handleNew);
    socket.on('message:sent', handleSent);
    socket.on('message:error', handleError);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('message:new', handleNew);
      socket.off('message:sent', handleSent);
      socket.off('message:error', handleError);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    (recipientId: string, content: string) => {
      const socket = getSocket();
      if (!socket || !content.trim()) return;
      const tempId = uuidv4();
      const optimistic: Message = {
        id: tempId,
        conversation_id: conversationId ?? '',
        sender_id: currentUserId,
        content: content.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
        tempId,
        status: 'pending',
      };
      setMessages((prev) => [...prev, optimistic]);
      socket.emit('message:send', { recipientId, content: content.trim(), tempId });
    },
    [conversationId, currentUserId]
  );

  const retryMessage = useCallback(
    (tempId: string, recipientId: string) => {
      const socket = getSocket();
      const message = messages.find((m) => m.tempId === tempId);
      if (!socket || !message) return;
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: 'pending' as const } : m))
      );
      socket.emit('message:send', { recipientId, content: message.content, tempId });
    },
    [messages]
  );

  return { messages, loading, disconnected, sendMessage, retryMessage };
}
