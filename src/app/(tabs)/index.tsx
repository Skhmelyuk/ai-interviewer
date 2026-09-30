import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { getCustomApiKey, getEnvApiKey } from "@/services/storage";
import { sendChatToOpenRouter } from "@/services/openrouter";

export default function HomeScreen() {
  const router = useRouter();
  const [hasKey, setHasKey] = useState(false);
  const [keySource, setKeySource] = useState<"secure_store" | "env" | null>(
    null,
  );
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkKey();
    }, []),
  );

  const checkKey = async () => {
    const customKey = await getCustomApiKey();
    if (customKey) {
      setHasKey(true);
      setKeySource("secure_store");
      return;
    }
    const envKey = getEnvApiKey();
    if (envKey) {
      setHasKey(true);
      setKeySource("env");
      return;
    }
    setHasKey(false);
    setKeySource(null);
  };

  const testAI = async () => {
    if (!hasKey) {
      Alert.alert(
        "Ключ не знайдено",
        "Перед тестуванням збережіть API-ключ OpenRouter у вкладці Налаштування або додайте його у файл .env.",
        [
          { text: "Скасувати", style: "cancel" },
          {
            text: "Налаштування",
            onPress: () => router.push("/(tabs)/settings"),
          },
        ],
      );
      return;
    }

    setLoading(true);
    setTestResponse(null);
    try {
      const reply = await sendChatToOpenRouter({
        messages: [
          {
            role: "system",
            content:
              "Ти досвідчений Mobile Tech Lead. Дай коротку надихаючу пораду (1 речення) кандидату на посаду Junior React Native розробника українською мовою.",
          },
          { role: "user", content: "Привіт! Я готовий до співбесіди." },
        ],
      });
      setTestResponse(reply);
    } catch (err: any) {
      Alert.alert("Помилка AI", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <ScrollView
        contentContainerClassName="flex-grow p-6 justify-center items-center"
        showsVerticalScrollIndicator={false}
      >
        {/* Статус ключа */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.8}
          className={`flex-row items-center gap-2 rounded-full px-4 py-1.5 mb-6 border ${
            hasKey
              ? "bg-accent-success/20 border-accent-success/40"
              : "bg-accent-warning/20 border-accent-warning/40"
          }`}
        >
          <View
            className={`w-2 h-2 rounded-full ${
              hasKey ? "bg-accent-success" : "bg-accent-warning"
            }`}
          />
          <Text
            className={`text-xs font-semibold ${
              hasKey ? "text-accent-success" : "text-accent-warning"
            }`}
          >
            {hasKey
              ? keySource === "env"
                ? "API-ключ підключено (.env)"
                : "API-ключ підключено (SecureStore)"
              : "Потрібно налаштувати ключ"}
          </Text>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-white text-center mb-2">
          AI Mock Interviewer
        </Text>
        <Text className="text-sm text-slate-400 text-center mb-8 max-w-xs">
          Тестування з'єднання з OpenRouter AI та сховища ключів SecureStore
        </Text>

        {/* Кнопка тестового запиту */}
        <TouchableOpacity
          onPress={testAI}
          disabled={loading}
          activeOpacity={0.8}
          className="w-full max-w-sm rounded-2xl bg-primary py-4 items-center shadow-lg active:bg-primary-dark mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-white text-base">
              &#x1f680; Перевірити зв'язок з AI
            </Text>
          )}
        </TouchableOpacity>

        {/* Перехід до налаштувань */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.8}
          className="w-full max-w-sm rounded-2xl bg-slate-800 py-3.5 items-center border border-slate-700 active:bg-slate-700 mb-6"
        >
          <Text className="text-slate-300 font-semibold text-sm">
            ⚙️ Відкрити налаштування (Settings Tab)
          </Text>
        </TouchableOpacity>

        {/* Результат від AI */}
        {testResponse && (
          <View className="w-full max-w-sm rounded-2xl bg-background-card p-5 border border-slate-700 shadow-xl">
            <Text className="text-xs font-bold text-accent-purple mb-2 uppercase tracking-wider">
              Відповідь AI (Tech Lead):
            </Text>
            <Text className="text-slate-200 text-sm leading-relaxed">
              {testResponse}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
