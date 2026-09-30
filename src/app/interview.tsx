import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InterviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-dark p-6 justify-center items-center">
      <View className="w-full max-w-sm rounded-3xl bg-background-card p-6 border border-slate-700 shadow-2xl items-center">
        <Text className="text-xl font-bold text-white mb-2">
          &#x1f399;️ Екран співбесіди
        </Text>
        <Text className="text-sm text-slate-400 mb-6 text-center">
          Повноцінний інтерактивний чат із AI Tech Lead буде реалізовано в
          Інструкції 3.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="rounded-xl bg-primary px-6 py-3 items-center active:bg-primary-dark"
        >
          <Text className="font-semibold text-white text-sm">
            Завершити співбесіду
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
