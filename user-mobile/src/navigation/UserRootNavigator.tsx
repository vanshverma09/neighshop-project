import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import UserTabNavigator from './UserTabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ReportAdScreen from '../screens/ReportAdScreen';

export type UserRootStackParamList = {
  Splash: undefined;
  MainTabs: { screen?: string } | undefined;
  ProductDetail: { adId: number };
  Login: undefined;
  Register: undefined;
  ReportAd: { adId: number; adTitle: string };
};

const Stack = createNativeStackNavigator<UserRootStackParamList>();

export default function UserRootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
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
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
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
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportAd"
        component={ReportAdScreen}
        options={{
          title: 'Report Advertisement',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
