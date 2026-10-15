import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerTabNavigator from './SellerTabNavigator';
import SellerLoginScreen from '../screens/SellerLoginScreen';
import SellerRegisterScreen from '../screens/SellerRegisterScreen';
import PostAdScreen from '../screens/PostAdScreen';
import { IAdvertisement } from '../types/advertisement.types';

export type SellerRootStackParamList = {
  SellerMain: undefined;
  SellerLogin: undefined;
  SellerRegister: undefined;
  EditAd: { editAd: IAdvertisement };
};

const Stack = createNativeStackNavigator<SellerRootStackParamList>();

export default function SellerRootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SellerMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#002f34',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="SellerMain"
        component={SellerTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SellerLogin"
        component={SellerLoginScreen}
        options={{ title: 'Merchant Sign In', headerShown: false }}
      />
      <Stack.Screen
        name="SellerRegister"
        component={SellerRegisterScreen}
        options={{ title: 'Register Storefront', headerShown: false }}
      />
      <Stack.Screen
        name="EditAd"
        component={PostAdScreen}
        options={{ title: 'Edit Advertisement' }}
      />
    </Stack.Navigator>
  );
}
