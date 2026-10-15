import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabNavigator from './UserTabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';

export type UserRootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { adId: number };
};

const Stack = createNativeStackNavigator<UserRootStackParamList>();

export default function UserRootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#002f34',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={UserTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Ad Details',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
