import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { getSocket } from '../socket/socketClient';
import { Message, MessageNew, MessageSent, MessageError } from '../types';

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat(recipientId: string, currentUserId: string) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ id: string }>(`/conversations/with/${recipientId}`)
      .then(({ data }) => { if (!cancelled) setConversationId(data.id); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [recipientId]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<{ messages: Message[] }>(`/conversations/${conversationId}/messages`)
      .then(({ data }) => { if (!cancelled) setMessages(data.messages); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (data: MessageNew) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          conversation_id: conversationId ?? '',
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
            ? { ...m, id: data.id, created_at: data.createdAt, status: 'sent' as const, tempId: undefined }
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
      const tempId = generateTempId();
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
