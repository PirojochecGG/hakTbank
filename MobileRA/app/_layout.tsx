import { Tabs } from "expo-router";
import { View } from "react-native";
import { useContext } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext, ThemeProvider } from "../ThemeContext";

function RootLayoutContent() {
  const { isDark } = useContext(ThemeContext);

  const tabBarBg = isDark ? '#444' : '#ffffff';
  const bottomBarBg = isDark ? '#444' : '#fff';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 8,
          },
          tabBarActiveTintColor: '#ffdd2d',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Чат',
            tabBarLabel: 'Чат',
            tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Профиль',
            tabBarLabel: 'Профиль',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>
      <View style={{ height: 30, backgroundColor: bottomBarBg }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
