import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerTabNavigator from './SellerTabNavigator';

export type SellerRootStackParamList = {
  SellerMain: undefined;
};

const Stack = createNativeStackNavigator<SellerRootStackParamList>();

export default function SellerRootNavigator() {
  return (
    <Stack.Navigator
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
    </Stack.Navigator>
  );
}
