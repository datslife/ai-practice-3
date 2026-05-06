import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import UserListScreen from '../screens/UserListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { User } from '../types';

export type MainStackParamList = {
  UserList: undefined;
  Chat: { recipient: User; conversationId: string | null };
  Profile: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={({ navigation }) => ({
          title: 'Chats',
          headerRight: () => (
            <TouchableOpacity
              testID="nav-profile-button"
              onPress={() => navigation.navigate('Profile')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#2563eb' }}>Profile</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
