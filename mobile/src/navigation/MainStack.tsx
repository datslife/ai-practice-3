import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { StackNavigationProp } from '@react-navigation/stack';
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

type UserListNav = StackNavigationProp<MainStackParamList, 'UserList'>;

function ProfileButton({ navigation }: { navigation: UserListNav }) {
  return (
    <TouchableOpacity
      testID="nav-profile-button"
      onPress={() => navigation.navigate('Profile')}
      style={styles.profileButton}
    >
      <Text style={styles.profileButtonText}>Profile</Text>
    </TouchableOpacity>
  );
}

export function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={({ navigation }) => ({
          title: 'Chats',
          headerRight: () => <ProfileButton navigation={navigation} />,
        })}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  profileButton: { marginRight: 16 },
  profileButtonText: { color: '#2563eb' },
});
