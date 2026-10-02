import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@/constants/models";
import {
  deleteApiKey,
  getCustomApiKey,
  getEnvApiKey,
  getInterviewPreferences,
  getSelectedModel,
  saveApiKey,
  saveInterviewPreferences,
  saveSelectedModel,
} from "@/services/storage";
import {
  AIModelTier,
  InterviewPreferences,
  TimerDurationOption,
} from "@/types";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isSavedInSecureStore, setIsSavedInSecureStore] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTier, setActiveTier] = useState<"all" | AIModelTier>("all");
  const [preferences, setPreferences] = useState<InterviewPreferences>({
    isVoiceEnabled: true,
    timerSeconds: 90,
    isHapticsEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Функція оновлення налаштувань:
  const updatePref = async (newPrefs: InterviewPreferences) => {
    setPreferences(newPrefs);
    await saveInterviewPreferences(newPrefs);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const customKey = await getCustomApiKey();
      const envKey = getEnvApiKey();
      const existingModel = await getSelectedModel();
      const prefs = await getInterviewPreferences();
      setPreferences(prefs);

      setHasEnvKey(!!envKey);

      if (customKey) {
        setApiKeyInput(customKey);
        setIsSavedInSecureStore(true);
      } else {
        setApiKeyInput("");
        setIsSavedInSecureStore(false);
      }

      const validModelIds = AVAILABLE_MODELS.map((m) => m.id);
      if (existingModel && validModelIds.includes(existingModel)) {
        setSelectedModel(existingModel);
      } else {
        setSelectedModel(DEFAULT_MODEL);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKeyInput.trim().startsWith("sk-or-v1-")) {
      Alert.alert(
        "Некоректний формат",
        "API-ключ OpenRouter починається з 'sk-or-v1-'. Будь ласка, перевірте скопійоване значення.",
      );
      return;
    }

    setLoading(true);
    try {
      await saveApiKey(apiKeyInput.trim());
      await saveSelectedModel(selectedModel);
      setIsSavedInSecureStore(true);
      Alert.alert("Успіх", "Налаштування успішно збережено в SecureStore!");
    } catch (err: any) {
      Alert.alert("Помилка", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Підтвердження",
      "Ви впевнені, що хочете видалити збережений у SecureStore API-ключ?" +
        (hasEnvKey
          ? "\n\n(Після видалення буде використовуватись ключ із .env)"
          : ""),
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey();
            setApiKeyInput("");
            setIsSavedInSecureStore(false);
            Alert.alert(
              "Ключ видалено",
              hasEnvKey
                ? "Активним залишається ключ із файлу .env."
                : "Ключ видалено. AI-функції будуть недоступні до введення нового ключа.",
            );
          },
        },
      ],
    );
  };

  const filteredModels =
    activeTier === "all"
      ? AVAILABLE_MODELS
      : AVAILABLE_MODELS.filter((m) => m.tier === activeTier);

  const getBadgeStyles = (tier?: AIModelTier) => {
    switch (tier) {
      case "free":
        return {
          container: "bg-emerald-500/20 border-emerald-500/40",
          text: "text-emerald-300",
        };
      case "budget":
        return {
          container: "bg-sky-500/20 border-sky-500/40",
          text: "text-sky-300",
        };
      case "mid":
        return {
          container: "bg-amber-500/20 border-amber-500/40",
          text: "text-amber-300",
        };
      case "flagship":
        return {
          container: "bg-purple-500/20 border-purple-500/40",
          text: "text-purple-300",
        };
      default:
        return {
          container: "bg-slate-800 border-slate-700",
          text: "text-slate-300",
        };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full rounded-3xl bg-background-card p-6 border border-slate-800 shadow-2xl">
          <Text className="text-2xl font-bold text-white mb-1">
            ⚙️ Налаштування AI
          </Text>
          <Text className="text-xs text-slate-400 mb-6">
            Керуйте API-ключем OpenRouter та обирайте моделі різної потужності й
            цінової категорії.
          </Text>

          {/* Статус джерела ключа */}
          <View className="mb-6 rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Поточний статус ключа
            </Text>
            <View className="flex-row items-center gap-2">
              <View
                className={`h-2.5 w-2.5 rounded-full ${
                  isSavedInSecureStore
                    ? "bg-accent-success"
                    : hasEnvKey
                      ? "bg-primary"
                      : "bg-accent-danger"
                }`}
              />
              <Text className="text-sm font-medium text-white">
                {isSavedInSecureStore
                  ? "Збережено в SecureStore (пріоритет)"
                  : hasEnvKey
                    ? "Підключено з файлу .env (fallback)"
                    : "Ключ не встановлено"}
              </Text>
            </View>
            <Text className="text-[11px] text-slate-500 mt-2 leading-4">
              Ключ із SecureStore шифрується апаратно на пристрої (iOS Keychain
              / Android KeyStore) та має вищий пріоритет над .env.
            </Text>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-xs text-slate-400 mt-3">
                Завантаження конфігурації...
              </Text>
            </View>
          ) : (
            <View>
              {/* Поле введення API ключа */}
              <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                OpenRouter API Key
              </Text>
              <TextInput
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="sk-or-v1-xxxxxxxx..."
                placeholderTextColor="#64748B"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white border border-slate-700 mb-4 text-xs font-mono"
              />

              {/* Вибір моделі */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Моделі AI ({AVAILABLE_MODELS.length})
                </Text>
              </View>

              {/* Фільтри категорій */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2 mb-3"
              >
                {[
                  { id: "all", label: `Всі (${AVAILABLE_MODELS.length})` },
                  { id: "free", label: "🆓 Free (4)" },
                  { id: "budget", label: "💡 Budget (4)" },
                  { id: "mid", label: "⚡ Mid-Tier (5)" },
                  { id: "flagship", label: "👑 Flagship (4)" },
                ].map((chip) => {
                  const isSelected = activeTier === chip.id;
                  return (
                    <TouchableOpacity
                      key={chip.id}
                      onPress={() =>
                        setActiveTier(chip.id as "all" | AIModelTier)
                      }
                      activeOpacity={0.8}
                      className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-slate-900 border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          isSelected ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View className="gap-2 mb-6">
                {filteredModels.map((m) => {
                  const active = selectedModel === m.id;
                  const badge = getBadgeStyles(m.tier);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedModel(m.id)}
                      activeOpacity={0.8}
                      className={`rounded-xl p-3 border ${
                        active
                          ? "bg-primary/20 border-primary"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <View className="flex-row items-center justify-between gap-2">
                        <Text
                          className={`text-xs font-bold flex-1 ${
                            active ? "text-primary-light" : "text-white"
                          }`}
                        >
                          {m.name}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-full border ${badge.container}`}
                        >
                          <Text
                            className={`text-[9px] font-semibold ${badge.text}`}
                          >
                            {m.pricing || (m.isFree ? "Безкоштовно" : "Платна")}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[10px] text-slate-400 mt-1">
                        {m.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Картка інфо про голосове введення */}
              <View className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
                  <Text className="text-base">&#x1f399;️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-white">
                    Голосове введення (Whisper STT)
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">
                    Натисніть мікрофон на екрані співбесіди для диктування
                    технічних відповідей голосом.
                  </Text>
                </View>
              </View>
              {/* Кнопки збереження/видалення */}
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                className="rounded-xl bg-primary py-3.5 items-center active:bg-primary-dark mb-3"
              >
                <Text className="font-bold text-white text-sm">
                  {isSavedInSecureStore
                    ? "Оновити в SecureStore"
                    : "Зберегти в SecureStore"}
                </Text>
              </TouchableOpacity>

              {isSavedInSecureStore && (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.8}
                  className="rounded-xl bg-accent-danger/20 border border-accent-danger/40 py-2.5 items-center"
                >
                  <Text className="text-accent-danger text-xs font-semibold">
                    Видалити ключ із SecureStore
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {/* Секція: Режим реалістичного інтерв'ю */}
        <View className="mb-6 rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
          <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            &#x1f399;️ Режим симуляції співбесіди
          </Text>

          {/* Перемикач озвучення */}
          <View className="flex-row items-center justify-between py-2 border-b border-slate-800">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-white">
                Озвучення Tech Lead
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Зачитувати запитання на слух (Text-to-Speech)
              </Text>
            </View>
            <Switch
              value={preferences.isVoiceEnabled}
              onValueChange={(val) =>
                updatePref({ ...preferences, isVoiceEnabled: val })
              }
              trackColor={{ false: "#334155", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Перемикач вібрації */}
          <View className="flex-row items-center justify-between py-2 border-b border-slate-800">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-white">
                Тактильний відгук
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                Вібрація при отриманні відповіді та таймері
              </Text>
            </View>
            <Switch
              value={preferences.isHapticsEnabled}
              onValueChange={(val) =>
                updatePref({ ...preferences, isHapticsEnabled: val })
              }
              trackColor={{ false: "#334155", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Вибір ліміту таймера */}
          <View className="pt-3">
            <Text className="text-xs font-bold text-white mb-1.5">
              Обмеження часу на відповідь
            </Text>
            <View className="flex-row gap-2">
              {[
                { id: 0, label: "Без ліміту" },
                { id: 60, label: "60 сек" },
                { id: 90, label: "90 сек" },
                { id: 120, label: "120 сек" },
              ].map((option) => {
                const isSelected = preferences.timerSeconds === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() =>
                      updatePref({
                        ...preferences,
                        timerSeconds: option.id as TimerDurationOption,
                      })
                    }
                    className={`flex-1 py-2 rounded-xl border items-center ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isSelected ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
