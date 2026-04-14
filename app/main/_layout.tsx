import { TabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';
import React from 'react';

export default function MainLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', headerShown: false }}
      />
      <Tabs.Screen
        name="applied"
        options={{ title: 'Applied', headerShown: false }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tabs>
  );
}
