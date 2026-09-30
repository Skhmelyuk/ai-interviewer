import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-dark p-6 justify-center items-center">
      <View className="w-full max-w-sm rounded-3xl bg-background-card p-6 border border-slate-700 shadow-2xl">
        <Text className="text-xl font-bold text-white mb-2">
          ⚙️ Налаштування OpenRouter
        </Text>
        <Text className="text-sm text-slate-400 mb-6">
          Тут буде збереження API-ключа в SecureStore та вибір моделі
          (Інструкція 2).
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.8}
          className="rounded-xl bg-primary py-3 items-center active:bg-primary-dark"
        >
          <Text className="font-semibold text-white text-sm">
            До головного екрана
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
