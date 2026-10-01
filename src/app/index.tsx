import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { CalendarWidget } from '../widgets/calenderwidget';

const API_URL = 'https://dsdev.symstech.com/api/dumyDataForAPI/Widget';
const CACHE_KEY = 'CALENDAR_WIDGET_DATA';

// Cross-platform storage helper (Web par localStorage, Mobile par SecureStore)
const Storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};

export default function HomeScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [taskCount, setTaskCount] = useState<number>(0);

  const normalizeData = (rawList: any[]) => {
    return rawList.map((item: any, index: number) => {
      const type = (item.type || item.department || 'general').toLowerCase();
      let color = item.color;
      if (!color) {
        if (type.includes('hr')) color = '#10b981';
        else if (type.includes('market')) color = '#3b82f6';
        else color = '#f59e0b';
      }

      return {
        id: item.id || index + 1,
        title: item.title || item.task_name || item.name || `Task ${index + 1}`,
        date: item.date || item.task_date || item.due_date || '2026-09-05',
        type,
        color,
      };
    });
  };

  const initializeWidgetData = async () => {
    try {
      const cached = await Storage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setTaskCount(parsed.length);
        if (Platform.OS === 'android') {
          await requestWidgetUpdate({
            widgetName: 'CalendarWidget',
            renderWidget: () => <CalendarWidget activities={parsed} />,
          });
        }
      } else {
        await fetchAndSyncWidget();
      }
    } catch (err) {
      console.error('Storage Read Error:', err);
      await fetchAndSyncWidget();
    }
  };

  const fetchAndSyncWidget = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let json: any;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned non-JSON status ${response.status}`);
      }

      const rawList = Array.isArray(json) ? json : json?.data || [];
      const normalized = normalizeData(rawList);

      await Storage.setItem(CACHE_KEY, JSON.stringify(normalized));
      setTaskCount(normalized.length);

      // Sirf Android par Widget update dispatch hoga
      if (Platform.OS === 'android') {
        await requestWidgetUpdate({
          widgetName: 'CalendarWidget',
          renderWidget: () => <CalendarWidget activities={normalized} />,
        });
      }

      Alert.alert('Success', `Updated with ${normalized.length} tasks!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update widget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeWidgetData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar Widget App</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'android'
          ? 'Home screen par long press karein aur Widgets me Month Calendar choose karein.'
          : 'Widgets functionality is only supported on Android native devices.'}
      </Text>

      {taskCount > 0 && (
        <Text style={styles.badge}>
          Synced Tasks: <Text style={styles.bold}>{taskCount}</Text>
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={fetchAndSyncWidget}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Force Update Widget</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  badge: {
    fontSize: 13,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  bold: { fontWeight: '700' },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
});
