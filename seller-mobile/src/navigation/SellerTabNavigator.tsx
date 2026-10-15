import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import MyAdsScreen from '../screens/MyAdsScreen';
import PostAdScreen from '../screens/PostAdScreen';
import InquiriesScreen from '../screens/InquiriesScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';

export type SellerTabParamList = {
  Dashboard: undefined;
  MyAds: { filter?: string } | undefined;
  PostAd: { editAd?: any } | undefined;
  Inquiries: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<SellerTabParamList>();

interface TabIconProps {
  icon: string;
  focused: boolean;
  label: string;
  isSpecial?: boolean;
}

function TabIcon({ icon, focused, label, isSpecial }: TabIconProps) {
  if (isSpecial) {
    return (
      <View style={styles.specialTabItem}>
        <View style={styles.specialIconCircle}>
          <Text style={styles.specialIconText}>{icon}</Text>
        </View>
        <Text style={styles.specialLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function SellerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SellerDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} label="Studio" />
        }}
      />
      <Tab.Screen
        name="MyAds"
        component={MyAdsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} label="My Ads" />
        }}
      />
      <Tab.Screen
        name="PostAd"
        component={PostAdScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} label="SELL" isSpecial />
        }}
      />
      <Tab.Screen
        name="Inquiries"
        component={InquiriesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} label="Inquiries" />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SellerProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏪" focused={focused} label="Store" />
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
  },
  tabLabelActive: {
    color: '#002f34',
    fontWeight: '700',
  },
  specialTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  specialIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffce32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  specialIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002f34',
  },
  specialLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#002f34',
    marginTop: 2,
  },
});
