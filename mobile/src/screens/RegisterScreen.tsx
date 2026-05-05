import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthStack';
import { useAuth } from '../hooks/useAuth';

type Nav = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation<Nav>();

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), name.trim(), password);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } };
      if (axiosErr.response?.status === 409) {
        setError('Email already in use');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 },
  error: { color: '#f55', marginBottom: 8, fontSize: 14 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', textAlign: 'center', fontSize: 14 },
});
