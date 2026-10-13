import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import CommunityScreen from './CommunityScreen';
import LearnScreen from './LearnScreen';
import ProfileScreen from './ProfileScreen';
import { colors } from '../theme';

const TABS = [
  { id: 'home', label: 'Inicio' },
  { id: 'map', label: 'Mapa' },
  { id: 'community', label: 'Ciudad' },
  { id: 'learn', label: 'Guía' },
  { id: 'profile', label: 'Perfil' },
];

export default function MainTabs({ navigation }) {
  const [tab, setTab] = useState('home');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.body}>
        {tab === 'home' && <HomeScreen navigation={navigation} onOpenTab={setTab} />}
        {tab === 'map' && <MapScreen navigation={navigation} />}
        {tab === 'community' && <CommunityScreen />}
        {tab === 'learn' && <LearnScreen onOpenTab={setTab} />}
        {tab === 'profile' && <ProfileScreen navigation={navigation} />}
      </View>
      <View style={styles.bar}>
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <TouchableOpacity key={item.id} style={styles.tab} onPress={() => setTab(item.id)}>
              <Text style={[styles.tabText, active && styles.tabTextOn]}>{item.label}</Text>
              {active && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: colors.green },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
});
