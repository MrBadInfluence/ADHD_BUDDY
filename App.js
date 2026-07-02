import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, Component } from 'react';
import { View, ActivityIndicator, LogBox, Text, ScrollView } from 'react-native';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>JS Error caught:</Text>
          <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: 'monospace' }}>{String(this.state.error)}</Text>
          {this.state.error?.stack ? (
            <Text style={{ color: '#aaaaaa', fontSize: 11, marginTop: 16, fontFamily: 'monospace' }}>{this.state.error.stack}</Text>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

LogBox.ignoreAllLogs();
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DailyFlowTutorialScreen } from './screens/DailyFlowTutorialScreen';
import { DailyFocusScreen } from './screens/DailyFocusScreen';
import { DailyFocusWithAlertsScreen } from './screens/DailyFocusWithAlertsScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { FocusSettingsScreen } from './screens/FocusSettingsScreen';
import { ProgressWinsScreen } from './screens/ProgressWinsScreen';
import { RoutineTrackerScreen } from './screens/RoutineTrackerScreen';
import { TaskBrainstormingScreen } from './screens/TaskBrainstormingScreen';
import { TaskDetailScreen } from './screens/TaskDetailScreen';
import { WeeklyOverviewScreen } from './screens/WeeklyOverviewScreen';
import { colors } from './theme';
import { startWearBridge } from './lib/wearBridge';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then(val => {
      setInitialRoute(val === 'true' ? 'DailyFocus' : 'Onboarding');
    }).catch(() => setInitialRoute('Onboarding'));
    startWearBridge();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.Surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.Primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <ThemeProvider>
    <UserProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="DailyFlowTutorial" component={DailyFlowTutorialScreen} />
        <Stack.Screen name="DailyFocus" component={DailyFocusScreen} />
        <Stack.Screen name="DailyFocusAlerts" component={DailyFocusWithAlertsScreen} />
        <Stack.Screen name="Alerts" component={AlertsScreen} />
        <Stack.Screen name="FocusSettings" component={FocusSettingsScreen} />
        <Stack.Screen name="ProgressWins" component={ProgressWinsScreen} />
        <Stack.Screen name="RoutineTracker" component={RoutineTrackerScreen} />
        <Stack.Screen name="TaskBrainstorming" component={TaskBrainstormingScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen name="WeeklyOverview" component={WeeklyOverviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </UserProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
