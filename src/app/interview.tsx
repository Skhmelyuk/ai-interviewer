import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessageBubble } from "@/components/MessageBubble";
import { INTERVIEW_LEVELS, INTERVIEW_TOPICS } from "@/constants/topics";
import { saveInterviewSession } from "@/services/historyStorage";
import { sendChatToOpenRouter } from "@/services/openrouter";
import { buildInterviewSystemPrompt } from "@/services/prompts";
import { parseAIReport } from "@/services/reportParser";
import { speakAssistantMessage, stopSpeech } from "@/services/speech";
import { getInterviewPreferences } from "@/services/storage";
import {
  ChatMessage,
  InterviewPreferences,
  InterviewSession,
  OpenRouterAPIMessage,
} from "@/types";

export default function InterviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topicId: string; levelId: string }>();

  const currentTopic =
    INTERVIEW_TOPICS.find((t) => t.id === params.topicId) ||
    INTERVIEW_TOPICS[0];
  const currentLevel =
    INTERVIEW_LEVELS.find((l) => l.id === params.levelId) ||
    INTERVIEW_LEVELS[1];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputAnswer, setInputAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Налаштування та таймер
  const [prefs, setPrefs] = useState<InterviewPreferences>({
    isVoiceEnabled: true,
    timerSeconds: 90,
    isHapticsEnabled: true,
  });
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVoiceActive, setIsVoiceActive] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadInitialConfig();
    return () => {
      stopSpeech();
      clearTimer();
    };
  }, []);

  const loadInitialConfig = async () => {
    const userPrefs = await getInterviewPreferences();
    setPrefs(userPrefs);
    setIsVoiceActive(userPrefs.isVoiceEnabled);
    initInterview(userPrefs);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (duration: number) => {
    clearTimer();
    if (duration <= 0) return;

    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleTimeout();
          return 0;
        }
        if (prev === 11 && prefs.isHapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (prefs.isHapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    Alert.alert(
      "Час вичерпано!",
      "Час на відповідь вийшов. Переходимо до наступного питання або оцінки.",
      [
        {
          text: "Продовжити",
          onPress: () =>
            handleSendAnswer(
              "Час вичерпано. Я не встиг відповісти на це запитання.",
            ),
        },
      ],
    );
  };

  const initInterview = async (currentPrefs: InterviewPreferences) => {
    setLoading(true);

    const systemPrompt = buildInterviewSystemPrompt(
      currentTopic,
      currentLevel.title,
      currentLevel.questionsCount,
    );

    const initialApiMessages: OpenRouterAPIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Добрий день! Я готовий розпочати співбесіду." },
    ];

    try {
      const firstReply = await sendChatToOpenRouter({
        messages: initialApiMessages,
      });
      const firstMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: firstReply,
        timestamp: Date.now(),
      };
      setMessages([firstMsg]);

      if (currentPrefs.isVoiceEnabled) {
        speakAssistantMessage(firstReply);
      }
      if (currentPrefs.timerSeconds > 0) {
        startTimer(currentPrefs.timerSeconds);
      }
    } catch (err: any) {
      Alert.alert("Помилка початку інтерв'ю", err.message, [
        { text: "Повернутися", onPress: () => router.replace("/(tabs)") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnswer = async (customAnswerText?: string) => {
    const textToSend = (customAnswerText || inputAnswer).trim();
    if (!textToSend || loading) return;

    clearTimer();
    stopSpeech();

    if (prefs.isHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setInputAnswer("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const systemPrompt = buildInterviewSystemPrompt(
      currentTopic,
      currentLevel.title,
      currentLevel.questionsCount,
    );

    const apiPayload: OpenRouterAPIMessage[] = [
      { role: "system", content: systemPrompt },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const aiReply = await sendChatToOpenRouter({ messages: apiPayload });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiReply,
        timestamp: Date.now(),
      };

      setMessages([...newMessages, aiMsg]);

      if (isVoiceActive) {
        speakAssistantMessage(aiReply);
      }

      // Перевіряємо, чи це завершальний звіт
      if (
        aiReply.includes("ЗАГАЛЬНА ОЦІНКА") ||
        aiReply.includes("СИЛЬНІ СТОРОНИ") ||
        aiReply.includes("ОЦІНКА:")
      ) {
        setIsFinished(true);
        clearTimer();

        if (prefs.isHapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const parsedReport = parseAIReport(aiReply);
        const sessionId = Date.now().toString();

        const sessionData: InterviewSession = {
          id: sessionId,
          topicId: currentTopic.id,
          topicTitle: currentTopic.title,
          levelId: currentLevel.id,
          levelTitle: currentLevel.title,
          timestamp: Date.now(),
          messages: [...newMessages, aiMsg],
          report: parsedReport,
        };

        saveInterviewSession(sessionData).catch((err) =>
          console.error("Помилка збереження сесії:", err),
        );

        setSavedSessionId(sessionId);
      } else {
        // Якщо інтерв'ю триває — запускаємо таймер на наступне питання
        if (prefs.timerSeconds > 0) {
          startTimer(prefs.timerSeconds);
        }
      }
    } catch (err: any) {
      Alert.alert("Помилка AI", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHint = () => {
    if (loading) return;
    handleSendAnswer(
      "[ПІДКАЗКА] Підкажи, будь ласка, з чого почати або дай короткий натяк?",
    );
  };

  const toggleVoice = () => {
    if (isVoiceActive) {
      stopSpeech();
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      const lastAssistantMsg = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistantMsg) {
        speakAssistantMessage(lastAssistantMsg.content);
      }
    }
  };

  // Колір смуги таймера
  const getTimerColor = () => {
    if (timeLeft <= 10) return "bg-rose-500";
    if (timeLeft <= 30) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Шапка екрану */}
      <View className="flex-row items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-900/60">
        <View className="flex-1 mr-2">
          <Text className="text-base font-bold text-white" numberOfLines={1}>
            {currentTopic.title}
          </Text>
          <Text className="text-[11px] text-accent-purple font-semibold">
            {currentLevel.title} • {currentLevel.questionsCount} питань
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Кнопка Mute звуку */}
          <TouchableOpacity
            onPress={toggleVoice}
            className={`rounded-xl p-2 border ${
              isVoiceActive
                ? "bg-primary/20 border-primary"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <Ionicons
              name={isVoiceActive ? "volume-high" : "volume-mute"}
              size={16}
              color={isVoiceActive ? "#60A5FA" : "#94A3B8"}
            />
          </TouchableOpacity>

          {/* Кнопка виходу */}
          <TouchableOpacity
            onPress={() => {
              stopSpeech();
              clearTimer();
              Alert.alert(
                "Завершити інтерв'ю?",
                "Ваш поточний прогрес не буде збережено.",
                [
                  { text: "Продовжити", style: "cancel" },
                  {
                    text: "Вийти",
                    style: "destructive",
                    onPress: () => router.replace("/(tabs)"),
                  },
                ],
              );
            }}
            className="rounded-xl bg-slate-800 px-3 py-1.5 border border-slate-700 active:bg-slate-700"
          >
            <Text className="text-xs text-slate-300">Вийти</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Шкала таймера (якщо активний) */}
      {prefs.timerSeconds > 0 && !isFinished && (
        <View className="bg-slate-900 border-b border-slate-800/80 px-4 py-1.5 flex-row items-center gap-3">
          <Ionicons
            name="time-outline"
            size={14}
            color={timeLeft <= 10 ? "#F43F5E" : "#94A3B8"}
          />
          <View className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <View
              className={`h-full rounded-full ${getTimerColor()}`}
              style={{ width: `${(timeLeft / prefs.timerSeconds) * 100}%` }}
            />
          </View>
          <Text
            className={`text-xs font-mono font-bold ${
              timeLeft <= 10 ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {timeLeft}с
          </Text>
        </View>
      )}

      {/* Чат */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <MessageBubble message={item} isVoiceEnabled={isVoiceActive} />
          )}
          contentContainerClassName="p-4 flex-grow"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            loading ? (
              <View className="flex-row items-center gap-2 p-3 bg-slate-900/60 rounded-2xl border border-slate-800 my-2 self-start">
                <ActivityIndicator size="small" color="#60A5FA" />
                <Text className="text-xs text-slate-300 italic">
                  Tech Lead формулює фідбек та наступне запитання...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Панель введення або завершення */}
        {!isFinished ? (
          <View className="p-3 border-t border-slate-800 bg-background-card">
            {/* Кнопка підказки над полем */}
            <View className="flex-row justify-between items-center mb-2 px-1">
              <TouchableOpacity
                onPress={handleRequestHint}
                disabled={loading}
                className="flex-row items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1 active:bg-slate-700"
              >
                <Text className="text-xs">&#x1f4a1;</Text>
                <Text className="text-[11px] font-semibold text-slate-300">
                  Попросити підказку
                </Text>
              </TouchableOpacity>

              {prefs.timerSeconds > 0 && (
                <Text className="text-[10px] text-slate-500">
                  Залишилось:{" "}
                  <Text className="font-bold text-slate-400">
                    {timeLeft} сек
                  </Text>
                </Text>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <TextInput
                value={inputAnswer}
                onChangeText={setInputAnswer}
                placeholder="Введіть вашу технічну відповідь..."
                placeholderTextColor="#64748B"
                multiline
                className="flex-1 max-h-24 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm"
              />

              <TouchableOpacity
                onPress={() => handleSendAnswer()}
                disabled={loading || !inputAnswer.trim()}
                className={`rounded-2xl px-5 py-3.5 items-center justify-center ${
                  inputAnswer.trim() && !loading
                    ? "bg-primary active:bg-primary-dark"
                    : "bg-slate-800 opacity-50"
                }`}
              >
                <Text className="text-white font-bold text-sm">Надіслати</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-4 border-t border-slate-800 bg-background-card gap-2.5">
            {savedSessionId && (
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: "/report/[id]",
                    params: { id: savedSessionId },
                  })
                }
                className="rounded-2xl bg-accent-success py-3.5 items-center shadow-lg active:opacity-90"
              >
                <Text className="text-white font-bold text-sm">
                  &#x1f4ca; Переглянути детальний звіт
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="rounded-2xl bg-slate-800 py-3.5 items-center border border-slate-700 active:bg-slate-700"
            >
              <Text className="text-slate-300 font-semibold text-sm">
                &#x1f504; На головну
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
