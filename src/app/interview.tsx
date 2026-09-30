import { MessageBubble } from "@/components/MessageBubble";
import { INTERVIEW_LEVELS, INTERVIEW_TOPICS } from "@/constants/topics";
import { sendChatToOpenRouter } from "@/services/openrouter";
import { buildInterviewSystemPrompt } from "@/services/prompts";
import { ChatMessage, OpenRouterAPIMessage } from "@/types";
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

  const flatListRef = useRef<FlatList>(null);

  // Старт співбесіди при завантаженні екрану
  useEffect(() => {
    initInterview();
  }, []);

  const initInterview = async () => {
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
    } catch (err: any) {
      Alert.alert("Помилка початку інтерв'ю", err.message, [
        { text: "Повернутися", onPress: () => router.replace("/(tabs)") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnswer = async () => {
    if (!inputAnswer.trim() || loading) return;

    const userMessageText = inputAnswer.trim();
    setInputAnswer("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
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

      // Якщо AI сформував фінальний звіт
      if (
        aiReply.includes("ЗАГАЛЬНА ОЦІНКА") ||
        aiReply.includes("СИЛЬНІ СТОРОНИ") ||
        aiReply.includes("ОЦІНКА:")
      ) {
        setIsFinished(true);
      }
    } catch (err: any) {
      Alert.alert("Помилка AI", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      {/* Шапка екрану */}
      <View className="flex-row items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-900/60">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-white" numberOfLines={1}>
            {currentTopic.title}
          </Text>
          <Text className="text-[11px] text-accent-purple font-semibold">
            {currentLevel.title} • {currentLevel.questionsCount} питань
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
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

      {/* Чат */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerClassName="p-4 flex-grow"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            loading ? (
              <View className="flex-row items-center gap-2 p-3 bg-slate-900/60 rounded-2xl border border-slate-800 my-2 self-start">
                <ActivityIndicator size="small" color="#60A5FA" />
                <Text className="text-xs text-slate-300 italic">
                  Tech Lead оцінює відповідь та готує запитання...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Панель введення або завершення */}
        {!isFinished ? (
          <View className="p-3 border-t border-slate-800 bg-background-card flex-row items-center gap-2">
            <TextInput
              value={inputAnswer}
              onChangeText={setInputAnswer}
              placeholder="Введіть вашу технічну відповідь..."
              placeholderTextColor="#64748B"
              multiline
              className="flex-1 max-h-24 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm"
            />

            <TouchableOpacity
              onPress={handleSendAnswer}
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
        ) : (
          <View className="p-4 border-t border-slate-800 bg-background-card">
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="rounded-2xl bg-accent-purple py-3.5 items-center shadow-lg active:opacity-90"
            >
              <Text className="text-white font-bold text-sm">
                🔄 Пройти ще одну співбесіду
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
