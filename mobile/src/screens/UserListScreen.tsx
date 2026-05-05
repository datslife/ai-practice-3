import React from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/stack';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainStack';
import { useUsers } from '../hooks/useUsers';
import { User } from '../types';

type Nav = StackNavigationProp<MainStackParamList, 'UserList'>;

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function UserListScreen() {
  const { filteredUsers, search, setSearch, loading, error, refetch } = useUsers();
  const navigation = useNavigation<Nav>();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#2563eb" /></View>;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search users..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: User }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { recipient: item, conversationId: null })}
          >
            <Avatar name={item.name} />
            <View style={styles.rowInfo}>
              <Text style={styles.userName}>{item.name}</Text>
            </View>
            <View
              testID="presence-dot"
              style={[styles.dot, item.status === 'online' ? styles.dotOnline : styles.dotOffline]}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  search: { backgroundColor: '#222', color: '#fff', padding: 12, margin: 12, borderRadius: 8, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  rowInfo: { flex: 1, marginLeft: 12 },
  userName: { color: '#fff', fontSize: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOnline: { backgroundColor: '#22c55e' },
  dotOffline: { backgroundColor: '#555' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#f55', marginBottom: 12 },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff' },
});
