import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/MainStack';
import { useChat } from '../hooks/useChat';
import { Message } from '../types';

const CURRENT_USER_ID = 'me';

type ChatRoute = RouteProp<MainStackParamList, 'Chat'>;

export default function ChatScreen() {
  const { params } = useRoute<ChatRoute>();
  const { recipient, conversationId } = params;
  const { messages, disconnected, sendMessage, retryMessage } = useChat(conversationId, CURRENT_USER_ID);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(recipient.id, text.trim());
    setText('');
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === CURRENT_USER_ID;
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.bubbleText}>{item.content}</Text>
        {item.status === 'failed' && (
          <TouchableOpacity onPress={() => retryMessage(item.tempId!, recipient.id)}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        )}
        {isMine && item.read_at && <Text style={styles.readReceipt}>✓✓ Read</Text>}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {disconnected && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Reconnecting...</Text>
        </View>
      )}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  banner: { backgroundColor: '#854d0e', padding: 8, alignItems: 'center' },
  bannerText: { color: '#fff', fontSize: 13 },
  list: { padding: 12 },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 10, marginBottom: 8 },
  bubbleMine: { backgroundColor: '#2563eb', alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: '#222', alignSelf: 'flex-start' },
  bubbleText: { color: '#fff', fontSize: 15 },
  readReceipt: { color: '#93c5fd', fontSize: 11, marginTop: 4, textAlign: 'right' },
  retry: { color: '#f87171', fontSize: 12, marginTop: 4 },
  inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#222' },
  input: { flex: 1, backgroundColor: '#222', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendButton: { justifyContent: 'center', paddingHorizontal: 12 },
  sendText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
});
