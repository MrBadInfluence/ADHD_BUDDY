import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { Routes } from '../navigation/Routes';
import { MindfulTopBar, AppBottomNav, useRealtimeClock, formatDate, getGreeting, SpeechTextInput, hapticLight, hapticMedium, hapticSuccess } from '../components/SharedComponents';
import { useUser } from '../context/UserContext';
import { syncTasksToWatch, subscribeToWatchEvents } from '../lib/wearBridge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ITEM_H = 62;

function offsetDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(date) {
  return `${DAYS_FULL[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

const initialBigThree = [
  { id: 1, title: 'Take morning medication', isCompleted: true, category: 'Health', duration: '5 min', energyLevel: 'Low' },
  { id: 2, title: 'Finish project proposal draft', isCompleted: false, category: 'Work', duration: '45 min', energyLevel: 'High' },
  { id: 3, title: 'Call insurance company re: claim', isCompleted: false, category: 'Admin', duration: '20 min', energyLevel: 'Med' },
];

const initialReminders = [
  { id: 4, title: "Reply to Emma's message", isCompleted: false, category: 'Personal' },
  { id: 5, title: 'Pick up prescription from chemist', isCompleted: false, category: 'Health' },
];

const initialUpcoming = {
  today: [
    { id: 10, title: 'Team stand-up at 10 AM', isCompleted: false },
    { id: 11, title: 'Send invoice to client', isCompleted: false },
  ],
  tomorrow: [
    { id: 12, title: 'Dentist appointment 2 PM', isCompleted: false },
    { id: 13, title: 'Grocery shop — weekly essentials', isCompleted: false },
  ],
  dayAfter: [
    { id: 14, title: 'Review monthly budget', isCompleted: false },
  ],
};

export function DailyFocusScreen({ navigation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { firstName } = useUser();
  const [bigThreeTasks, setBigThreeTasks] = useState(initialBigThree);
  const [reminderTasks, setReminderTasks] = useState(initialReminders);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [upcomingTasks, setUpcomingTasks] = useState(initialUpcoming);
  const [expandedDay, setExpandedDay] = useState('today');
  const [addingFor, setAddingFor] = useState(null);
  const [addText, setAddText] = useState('');
  const [lastDateStr, setLastDateStr] = useState(() => new Date().toDateString());
  const [showAddBigThree, setShowAddBigThree] = useState(false);
  const [newBigThreeText, setNewBigThreeText] = useState('');

  // â”€â”€ Sort mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sortMode, setSortMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);
  const sortModeRef = useRef(false);
  const activeDragIdRef = useRef(null);
  const dragInitialIdxRef = useRef(null);
  const reminderTasksRef = useRef(reminderTasks);
  const panResponders = useRef({});
  const jiggle = useRef(new Animated.Value(0)).current;
  const jiggleLoopRef = useRef(null);
  const longPressDidFireRef = useRef(false);
  const pressInTimeRef = useRef(null);
  const scrollViewRef = useRef(null);

  const now = useRealtimeClock();
  const pulse = useRef(new Animated.Value(0.92)).current;

  const allTasks = [...bigThreeTasks, ...reminderTasks];
  const progressPercent = allTasks.length > 0
    ? Math.round((allTasks.filter(t => t.isCompleted).length / allTasks.length) * 100)
    : 0;

  useEffect(() => { reminderTasksRef.current = reminderTasks; }, [reminderTasks]);

  // Sync task list to paired watch whenever it changes
  useEffect(() => {
    syncTasksToWatch(
      bigThreeTasks.map(t => ({ id: String(t.id), title: t.title, isDone: t.isCompleted })),
      reminderTasks.map(t => ({ id: String(t.id), title: t.title, isDone: t.isCompleted })),
    );
  }, [bigThreeTasks, reminderTasks]);

  // Handle Done / Snooze taps from the watch
  useEffect(() => {
    return subscribeToWatchEvents({
      onDone: (taskId) => {
        setBigThreeTasks(prev => prev.map(t => String(t.id) === taskId ? { ...t, isCompleted: true } : t));
        setReminderTasks(prev => prev.map(t => String(t.id) === taskId ? { ...t, isCompleted: true } : t));
      },
      onSnooze: (taskId) => {
        setReminderTasks(prev => prev.filter(t => String(t.id) !== taskId));
      },
    });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 1800, useNativeDriver: true })
      ])
    ).start();
  }, [pulse]);

  const jiggleDeg = useMemo(() =>
    jiggle.interpolate({ inputRange: [-1.2, 1.2], outputRange: ['-1.2deg', '1.2deg'] }), []);

  const activateSortMode = useCallback(() => {
    hapticMedium();
    scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    setSortMode(true);
    sortModeRef.current = true;
    jiggleLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1.2, duration: 70, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1.2, duration: 140, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 1.2, duration: 140, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 0, duration: 70, useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    jiggleLoopRef.current.start();
  }, []);

  const deactivateSortMode = useCallback(() => {
    scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    setSortMode(false);
    sortModeRef.current = false;
    setActiveDragId(null);
    activeDragIdRef.current = null;
    jiggleLoopRef.current?.stop();
    Animated.timing(jiggle, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, []);

  const lastPlacedIdxRef = useRef(null);

  const getPanResponder = useCallback((id) => {
    if (!panResponders.current[id]) {
      panResponders.current[id] = PanResponder.create({
        // Claim on start (fresh touch in sort mode)
        onStartShouldSetPanResponder: () => sortModeRef.current,
        // Claim on move â€” no activeDragId check so continuing long-press â†’ drag works
        onMoveShouldSetPanResponder: () => sortModeRef.current,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: () => {
          if (activeDragIdRef.current && activeDragIdRef.current !== id) return;
          hapticLight();
          dragInitialIdxRef.current = reminderTasksRef.current.findIndex(t => t.id === id);
          lastPlacedIdxRef.current = dragInitialIdxRef.current;
          activeDragIdRef.current = id;
          setActiveDragId(id);
        },

        onPanResponderMove: (_, gs) => {
          if (activeDragIdRef.current !== id) return;
          const len = reminderTasksRef.current.length;
          const targetIdx = Math.max(0, Math.min(
            len - 1,
            dragInitialIdxRef.current + Math.round(gs.dy / ITEM_H)
          ));
          if (targetIdx !== lastPlacedIdxRef.current) {
            lastPlacedIdxRef.current = targetIdx;
            hapticLight();
            setReminderTasks(prev => {
              const arr = [...prev];
              const from = arr.findIndex(t => t.id === id);
              if (from === -1 || from === targetIdx) return prev;
              const [item] = arr.splice(from, 1);
              arr.splice(targetIdx, 0, item);
              reminderTasksRef.current = arr;
              return arr;
            });
          }
        },

        onPanResponderRelease: () => {
          activeDragIdRef.current = null;
          dragInitialIdxRef.current = null;
          lastPlacedIdxRef.current = null;
          setActiveDragId(null);
          hapticLight();
        },

        onPanResponderTerminate: () => {
          activeDragIdRef.current = null;
          dragInitialIdxRef.current = null;
          lastPlacedIdxRef.current = null;
          setActiveDragId(null);
        },
      });
    }
    return panResponders.current[id];
  }, []);

  // â”€â”€ Task actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleBigThree = (id) => {
    hapticMedium();
    setBigThreeTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
      if (next.find(t => t.id === id)?.isCompleted) hapticSuccess();
      return next;
    });
  };

  const toggleReminder = (id) => {
    hapticLight();
    setReminderTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const addBigThreeTask = () => {
    if (!newBigThreeText.trim() || bigThreeTasks.length >= 3) return;
    setBigThreeTasks(prev => [...prev, {
      id: Date.now(),
      category: 'Task',
      title: newBigThreeText.trim(),
      duration: '',
      energyLevel: '',
      isCompleted: false,
    }]);
    setNewBigThreeText('');
    setShowAddBigThree(false);
  };

  const addReminderTask = () => {
    if (!newTaskText.trim()) return;
    setReminderTasks(prev => [...prev, { id: Date.now(), title: newTaskText.trim(), category: 'New', isCompleted: false }]);
    setNewTaskText('');
    setShowAddTask(false);
  };

  const toggleUpcoming = (day, id) => {
    hapticLight();
    setUpcomingTasks(prev => {
      const next = { ...prev, [day]: prev[day].map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t) };
      if (next[day].find(t => t.id === id)?.isCompleted) hapticSuccess();
      return next;
    });
  };

  const addUpcomingTask = (day) => {
    if (!addText.trim()) return;
    setUpcomingTasks(prev => ({ ...prev, [day]: [...prev[day], { id: Date.now(), title: addText.trim(), isCompleted: false }] }));
    setAddText('');
    setAddingFor(null);
  };

  useEffect(() => {
    const todayStr = now.toDateString();
    if (todayStr === lastDateStr) return;
    setUpcomingTasks(prev => {
      const carryover = prev.today.filter(t => !t.isCompleted).map(t => ({ ...t, rolledOver: true }));
      return { today: [...carryover, ...prev.tomorrow], tomorrow: prev.dayAfter, dayAfter: [] };
    });
    setLastDateStr(todayStr);
  }, [now, lastDateStr]);

  const dayConfigs = [
    { key: 'today',    label: 'Today',      date: now,                accentColor: colors.Primary,   bgColor: `${colors.Primary}0F` },
    { key: 'tomorrow', label: 'Tomorrow',   date: offsetDate(now, 1), accentColor: colors.Secondary, bgColor: `${colors.Secondary}0F` },
    { key: 'dayAfter', label: formatShortDate(offsetDate(now, 2)).split(',')[0], date: offsetDate(now, 2), accentColor: '#60604C', bgColor: '#60604C0F' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <MindfulTopBar />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={!sortMode}>

        {/* Greeting */}
        <View style={styles.section}>
          <Text style={styles.mutedLabel}>{formatDate(now)}</Text>
          <Text style={styles.pageTitle}>
            {getGreeting(now).replace('.', '')}{firstName ? `, ${firstName}.` : '.'}
          </Text>
          <Text style={styles.sectionBody}>One breath at a time. What matters most today?</Text>
        </View>

        {/* Big Three */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>The Big Three</Text>
            {bigThreeTasks.length < 3 && !showAddBigThree ? (
              <TouchableOpacity style={styles.newTaskRow} onPress={() => setShowAddBigThree(true)}>
                <MaterialIcons name="add" size={16} color={colors.Primary} />
                <Text style={styles.newTaskLabel}>ADD</Text>
              </TouchableOpacity>
            ) : <Text style={styles.sectionMeta}>FOCUS ZONE</Text>}
          </View>

          {showAddBigThree ? (
            <View style={styles.addTaskCard}>
              <SpeechTextInput
                style={styles.addTaskInput}
                value={newBigThreeText}
                onChangeText={setNewBigThreeText}
                placeholder="What's your priority task?"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addBigThreeTask}
              />
              <View style={styles.addTaskFooter}>
                <TouchableOpacity onPress={() => { setShowAddBigThree(false); setNewBigThreeText(''); }} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addBigThreeTask} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {bigThreeTasks.length > 0 ? (
            <TouchableOpacity style={styles.primaryCard} onPress={() => toggleBigThree(bigThreeTasks[0].id)} activeOpacity={0.85}>
              <View style={styles.primaryCardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskCategory}>{bigThreeTasks[0].category?.toUpperCase()}</Text>
                  <Text style={[styles.primaryTaskTitle, bigThreeTasks[0].isCompleted && styles.textDone]}>{bigThreeTasks[0].title}</Text>
                  <View style={styles.taskInfoRow}>
                    {bigThreeTasks[0].duration ? (
                      <View style={styles.taskInfoItem}>
                        <MaterialIcons name="schedule" size={14} color={colors.OnPrimaryContainer} />
                        <Text style={styles.taskInfoText}>{bigThreeTasks[0].duration}</Text>
                      </View>
                    ) : null}
                    {bigThreeTasks[0].energyLevel ? (
                      <View style={styles.taskInfoItem}>
                        <MaterialIcons name="bolt" size={14} color={colors.OnPrimaryContainer} />
                        <Text style={styles.taskInfoText}>{bigThreeTasks[0].energyLevel}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.primaryAction, { backgroundColor: bigThreeTasks[0].isCompleted ? colors.Primary : colors.SurfaceContainerLowest }]}>
                  <MaterialIcons name="check" size={26} color={bigThreeTasks[0].isCompleted ? colors.OnPrimary : colors.Primary} />
                </View>
              </View>
            </TouchableOpacity>
          ) : !showAddBigThree ? (
            <TouchableOpacity style={[styles.primaryCard, styles.emptyCard]} onPress={() => setShowAddBigThree(true)} activeOpacity={0.7}>
              <MaterialIcons name="add" size={28} color={`${colors.OnPrimaryContainer}66`} />
              <Text style={styles.emptyCardText}>Add your top priority task</Text>
            </TouchableOpacity>
          ) : null}

          {bigThreeTasks.length > 1 ? (
            <View style={styles.taskRow}>
              {bigThreeTasks.slice(1, 3).map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.secondaryCard, index === 0 ? { marginRight: 12 } : null]}
                  onPress={() => toggleBigThree(task.id)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.secondaryCategory}>{task.category?.toUpperCase()}</Text>
                    <Text style={[styles.secondaryTitle, task.isCompleted && styles.textDone]}>{task.title}</Text>
                  </View>
                  <View style={styles.secondaryFooter}>
                    <Text style={styles.secondaryDuration}>{task.duration}</Text>
                    <View style={[styles.secondaryCheckCircle, { backgroundColor: task.isCompleted ? colors.PrimaryContainer : colors.SurfaceContainerHigh }]}>
                      <MaterialIcons name="check" size={18} color={task.isCompleted ? colors.OnPrimaryContainer : colors.Outline} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* Gentle Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gentle Reminders</Text>
            {sortMode ? (
              <TouchableOpacity style={styles.newTaskRow} onPress={deactivateSortMode}>
                <MaterialIcons name="check" size={16} color={colors.Primary} />
                <Text style={styles.newTaskLabel}>DONE</Text>
              </TouchableOpacity>
            ) : !showAddTask ? (
              <TouchableOpacity style={styles.newTaskRow} onPress={() => setShowAddTask(true)}>
                <MaterialIcons name="add" size={16} color={colors.Primary} />
                <Text style={styles.newTaskLabel}>NEW TASK</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showAddTask && !sortMode ? (
            <View style={styles.addTaskCard}>
              <SpeechTextInput
                style={styles.addTaskInput}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="What do you need to do?"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addReminderTask}
              />
              <View style={styles.addTaskFooter}>
                <TouchableOpacity onPress={() => { setShowAddTask(false); setNewTaskText(''); }} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addReminderTask} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {reminderTasks.map((task) => {
            const isActive = activeDragId === task.id;
            const itemTransform = isActive
              ? [{ scale: 1.04 }]
              : sortMode ? [{ rotate: jiggleDeg }] : [];

            if (sortMode) {
              // Plain View (no Touchable) with panHandlers â€” nothing inside competes for the touch
              return (
                <View key={task.id} {...getPanResponder(task.id).panHandlers}>
                  <Animated.View style={{ transform: itemTransform, zIndex: isActive ? 10 : 1 }}>
                    <View style={[styles.reminderRow, isActive && styles.reminderRowActive]}>
                      <View style={styles.dragHandle}>
                        <MaterialIcons name="reorder" size={22} color={isActive ? colors.Primary : colors.Outline} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reminderText}>{task.title}</Text>
                        <Text style={styles.reminderCategory}>{task.category?.toUpperCase()}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              );
            }

            return (
              <Animated.View key={task.id} style={{ transform: itemTransform }}>
                <TouchableOpacity
                  style={[styles.reminderRow, { opacity: task.isCompleted ? 0.6 : 1 }]}
                  onPressIn={() => {
                    longPressDidFireRef.current = false;
                    pressInTimeRef.current = Date.now();
                  }}
                  onPress={() => {
                    if (longPressDidFireRef.current) return;
                    if (Date.now() - (pressInTimeRef.current || 0) > 400) return;
                    toggleReminder(task.id);
                  }}
                  onLongPress={() => { longPressDidFireRef.current = true; activateSortMode(); }}
                  delayLongPress={500}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reminderCheckbox, task.isCompleted && styles.reminderCheckboxCompleted]}>
                    {task.isCompleted ? <MaterialIcons name="check" size={18} color={colors.OnSurface} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderText, task.isCompleted && styles.reminderTextCompleted]}>{task.title}</Text>
                    <Text style={styles.reminderCategory}>{task.category.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Three-Day Task Planner */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Task Planner</Text>
            <Text style={styles.sectionMeta}>3-DAY VIEW</Text>
          </View>
          <View style={styles.plannerCard}>
            {dayConfigs.map((cfg, idx) => {
              const tasks = upcomingTasks[cfg.key];
              const isOpen = expandedDay === cfg.key;
              const doneCount = tasks.filter(t => t.isCompleted).length;
              const isAddingHere = addingFor === cfg.key;

              return (
                <View key={cfg.key}>
                  {idx > 0 ? <View style={styles.plannerDivider} /> : null}
                  <TouchableOpacity style={styles.plannerHeader} onPress={() => setExpandedDay(isOpen ? null : cfg.key)} activeOpacity={0.75}>
                    <View style={[styles.plannerAccent, { backgroundColor: cfg.accentColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.plannerDayLabel, { color: cfg.accentColor }]}>{cfg.label.toUpperCase()}</Text>
                      <Text style={styles.plannerDateLabel}>{formatShortDate(cfg.date)}</Text>
                    </View>
                    <View style={styles.plannerHeaderRight}>
                      {tasks.length > 0 ? (
                        <View style={[styles.plannerCountBadge, { backgroundColor: cfg.bgColor }]}>
                          <Text style={[styles.plannerCountText, { color: cfg.accentColor }]}>{doneCount}/{tasks.length}</Text>
                        </View>
                      ) : null}
                      <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={22} color={colors.Outline} style={{ marginLeft: 8 }} />
                    </View>
                  </TouchableOpacity>

                  {isOpen ? (
                    <View style={styles.plannerBody}>
                      {tasks.length === 0 && !isAddingHere ? (
                        <Text style={styles.plannerEmptyText}>No tasks yet. Tap + to add one.</Text>
                      ) : null}
                      {tasks.map(task => (
                        <TouchableOpacity
                          key={task.id}
                          style={[styles.plannerTaskRow, task.rolledOver && styles.plannerTaskRowCarried]}
                          onPress={() => toggleUpcoming(cfg.key, task.id)}
                        >
                          <View style={[styles.plannerCheckbox, task.isCompleted && { backgroundColor: cfg.accentColor, borderWidth: 0 }]}>
                            {task.isCompleted ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.plannerTaskText, task.isCompleted && styles.plannerTaskDone]}>{task.title}</Text>
                            {task.rolledOver && !task.isCompleted ? (
                              <View style={styles.carriedBadge}>
                                <MaterialIcons name="history" size={10} color={colors.OnSurfaceVariant} />
                                <Text style={styles.carriedBadgeText}>CARRIED OVER</Text>
                              </View>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      ))}
                      {isAddingHere ? (
                        <View style={styles.plannerAddRow}>
                          <SpeechTextInput
                            style={styles.plannerInput}
                            value={addText}
                            onChangeText={setAddText}
                            placeholder="New taskâ€¦"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={() => addUpcomingTask(cfg.key)}
                          />
                          <TouchableOpacity onPress={() => addUpcomingTask(cfg.key)} style={[styles.plannerAddBtn, { backgroundColor: cfg.accentColor }]}>
                            <MaterialIcons name="check" size={18} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { setAddingFor(null); setAddText(''); }} style={styles.plannerCancelBtn}>
                            <MaterialIcons name="close" size={18} color={colors.Outline} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.plannerAddTrigger} onPress={() => { setAddingFor(cfg.key); setAddText(''); }}>
                          <MaterialIcons name="add" size={16} color={cfg.accentColor} />
                          <Text style={[styles.plannerAddLabel, { color: cfg.accentColor }]}>ADD TASK</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress Breather */}
        <View style={styles.sectionCenter}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulse }] }]} />
          <View style={styles.pulseInner}>
            <Text style={styles.pulsePercent}>{progressPercent}%</Text>
          </View>
          <View style={{ width: '85%', alignItems: 'center' }}>
            <Text style={styles.breatherTitle}>
              {progressPercent === 100 ? 'All done â€” outstanding work!' : "You're in the flow."}
            </Text>
            <Text style={styles.breatherBody}>Take a moment to breathe before your next big focus block.</Text>
          </View>
        </View>

      </ScrollView>
      <AppBottomNav
        tabs={[
          { label: 'Focus', icon: 'track-changes', isActive: true },
          { label: 'Brainstorm', icon: 'lightbulb' },
          { label: 'Routines', icon: 'sync' },
          { label: 'Calendar', icon: 'calendar-today' },
          { label: 'Progress', icon: 'leaderboard' }
        ]}
        onTabSelected={(index) => navigation.navigate([Routes.DAILY_FOCUS, Routes.TASK_BRAINSTORMING, Routes.ROUTINE_TRACKER, Routes.WEEKLY_OVERVIEW, Routes.PROGRESS_WINS][index])}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.Surface },
  content: { paddingHorizontal: 24, paddingBottom: 16 },
  section: { marginTop: 32 },
  sectionCenter: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  watchCard: { marginTop: 18, borderRadius: 28, padding: 16, backgroundColor: colors.SurfaceContainerLow, borderWidth: 1, borderColor: colors.SurfaceContainerHighest },
  watchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  watchChip: { fontSize: 10, letterSpacing: 2, fontWeight: '800', color: colors.Secondary },
  watchTitle: { marginTop: 6, fontSize: 18, fontWeight: '800', color: colors.OnSurface },
  watchBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.Primary, alignItems: 'center', justifyContent: 'center' },
  watchStatsRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  watchStatBox: { flex: 1, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.SurfaceContainer, borderWidth: 1, borderColor: colors.SurfaceContainerHighest },
  watchValue: { fontSize: 18, fontWeight: '800', color: colors.OnSurface },
  watchLabel: { marginTop: 2, fontSize: 10, letterSpacing: 1, color: colors.OnSurfaceVariant },
  watchMiniRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  watchDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.Secondary },
  watchMiniText: { flex: 1, fontSize: 12, color: colors.OnSurfaceVariant, lineHeight: 17 },
  mutedLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 2, color: colors.OnSurfaceVariant },
  pageTitle: { marginTop: 6, fontSize: 40, fontWeight: '800', color: colors.Primary, lineHeight: 44 },
  sectionBody: { marginTop: 8, fontSize: 16, color: colors.OnSurfaceVariant, lineHeight: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.OnSurface },
  sectionMeta: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600', color: colors.Outline },

  taskRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  primaryCard: { borderRadius: 24, backgroundColor: colors.PrimaryContainer, padding: 24, elevation: 2, marginTop: 12 },
  primaryCardContent: { flexDirection: 'row', alignItems: 'center' },
  taskCategory: { fontSize: 10, letterSpacing: 2, fontWeight: '600', color: `${colors.OnPrimaryContainer}CC` },
  primaryTaskTitle: { marginTop: 8, fontSize: 22, fontWeight: '700', color: colors.OnPrimaryContainer, lineHeight: 28 },
  taskInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  taskInfoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  taskInfoText: { marginLeft: 4, fontSize: 13, color: `${colors.OnPrimaryContainer}CC` },
  primaryAction: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: `${colors.Primary}40`, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  secondaryCard: { flex: 1, height: 140, borderRadius: 20, backgroundColor: colors.SurfaceContainerLowest, padding: 16, justifyContent: 'space-between' },
  secondaryCategory: { fontSize: 9, letterSpacing: 1.5, fontWeight: '600', color: colors.Outline },
  secondaryTitle: { marginTop: 6, fontSize: 15, fontWeight: '700', color: colors.OnSurface, lineHeight: 20 },
  secondaryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryDuration: { fontSize: 12, fontWeight: '600', color: colors.OnSurfaceVariant },
  secondaryCheckCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  newTaskRow: { flexDirection: 'row', alignItems: 'center' },
  newTaskLabel: { marginLeft: 4, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.Primary },
  addTaskCard: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLow, padding: 16, marginTop: 10, marginBottom: 4 },
  addTaskInput: { fontSize: 15, fontWeight: '600', color: colors.OnSurface, minHeight: 44 },
  addTaskFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 10 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  cancelButtonText: { fontSize: 13, fontWeight: '700', color: colors.OnSurfaceVariant },
  addButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.Primary },
  addButtonText: { fontSize: 13, fontWeight: '700', color: colors.OnPrimary },
  reminderRow: { width: '100%', borderRadius: 16, backgroundColor: colors.SurfaceContainerLow, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 },
  reminderRowActive: { backgroundColor: colors.SurfaceContainerHigh, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6 },
  reminderCheckbox: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: `${colors.OutlineVariant}66`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  reminderCheckboxCompleted: { backgroundColor: `${colors.OutlineVariant}33`, borderWidth: 0 },
  reminderText: { fontSize: 15, fontWeight: '600', color: colors.OnSurface },
  reminderTextCompleted: { color: `${colors.OnSurface}80`, textDecorationLine: 'line-through' },
  reminderCategory: { marginTop: 2, fontSize: 10, letterSpacing: 1, fontWeight: '600', color: colors.Outline },
  dragHandle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, opacity: 0.6 },
  emptyCardText: { marginTop: 8, fontSize: 15, fontWeight: '600', color: colors.OnPrimaryContainer },

  plannerCard: { width: '100%', borderRadius: 24, backgroundColor: colors.SurfaceContainerLowest, overflow: 'hidden', marginTop: 12, elevation: 1 },
  plannerDivider: { height: 1, backgroundColor: colors.SurfaceContainerHigh, marginHorizontal: 16 },
  plannerHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  plannerAccent: { width: 4, height: 40, borderRadius: 2, marginRight: 14 },
  plannerDayLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  plannerDateLabel: { marginTop: 2, fontSize: 13, fontWeight: '600', color: colors.OnSurfaceVariant },
  plannerHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  plannerCountBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  plannerCountText: { fontSize: 11, fontWeight: '700' },
  plannerBody: { paddingHorizontal: 20, paddingBottom: 16 },
  plannerEmptyText: { fontSize: 13, color: colors.OutlineVariant, fontStyle: 'italic', marginBottom: 12 },
  plannerTaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  plannerCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.OutlineVariant, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  plannerTaskText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.OnSurface },
  plannerTaskDone: { color: `${colors.OnSurface}55`, textDecorationLine: 'line-through' },
  plannerTaskRowCarried: { backgroundColor: `${colors.Secondary}08`, borderRadius: 10, paddingHorizontal: 6 },
  carriedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  carriedBadgeText: { fontSize: 9, letterSpacing: 1, fontWeight: '700', color: colors.OnSurfaceVariant },
  plannerAddRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  plannerInput: { flex: 1, borderRadius: 12, backgroundColor: colors.SurfaceContainerLow, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontWeight: '600', color: colors.OnSurface },
  plannerAddBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  plannerCancelBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.SurfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  plannerAddTrigger: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  plannerAddLabel: { marginLeft: 4, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },

  textDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  pulseOuter: { width: 128, height: 128, borderRadius: 64, backgroundColor: `${colors.SecondaryFixedDim}66`, position: 'absolute' },
  pulseInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.SecondaryFixed, alignItems: 'center', justifyContent: 'center' },
  pulsePercent: { fontSize: 22, fontWeight: '700', color: colors.OnSecondaryFixed },
  breatherTitle: { marginTop: 140, fontSize: 16, fontWeight: '700', color: colors.OnSurface },
  breatherBody: { marginTop: 6, textAlign: 'center', fontSize: 14, color: colors.OnSurfaceVariant, lineHeight: 20 }
  });
}
