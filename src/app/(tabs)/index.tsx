import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6">
        {/* Бейдж статусу */}
        <View className="mb-4 rounded-full bg-accent-purple/20 px-4 py-1.5 border border-accent-purple/40">
          <Text className="text-xs font-semibold text-accent-purple tracking-wider uppercase">
            ⚡ Bottom Tabs • NativeWind v4
          </Text>
        </View>

        {/* Заголовок додатку */}
        <Text className="text-3xl font-extrabold text-white text-center mb-2">
          AI Mock Interviewer
        </Text>
        <Text className="text-base text-slate-400 text-center mb-8 max-w-xs">
          Тренажер технічних співбесід для Junior React Native розробників
        </Text>

        {/* Картка перевірки роутингу та Tailwind */}
        <View className="w-full max-w-sm rounded-2xl bg-background-card p-6 border border-slate-700/60 shadow-lg mb-6">
          <Text className="text-lg font-bold text-white mb-2">
            &#x1f680; Таби & Tailwind налаштовано!
          </Text>
          <Text className="text-sm text-slate-300 mb-4 leading-relaxed">
            Нижня панель вкладок (Tabs) активна. Перемикайтеся між співбесідою
            та налаштуваннями через нижній таббар.
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-slate-700">
            <Text className="text-slate-400 text-sm">
              Лічильник:{" "}
              <Text className="font-bold text-primary-light">{count}</Text>
            </Text>

            <TouchableOpacity
              onPress={() => setCount((prev) => prev + 1)}
              activeOpacity={0.8}
              className="rounded-xl bg-primary px-4 py-2 active:bg-primary-dark"
            >
              <Text className="font-semibold text-white text-sm">
                Клікнути (+1)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Кнопка переходу на повноекранний чат співбесіди */}
        <TouchableOpacity
          onPress={() => router.push("/interview")}
          activeOpacity={0.8}
          className="w-full max-w-sm rounded-2xl bg-primary py-3.5 items-center active:bg-primary-dark mb-3"
        >
          <Text className="text-white font-semibold text-sm">
            &#x1f399;️ Перейти до співбесіди
          </Text>
        </TouchableOpacity>

        {/* Кнопка швидкого переходу на таб налаштувань */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.8}
          className="w-full max-w-sm rounded-2xl bg-slate-800 py-3.5 items-center border border-slate-700 active:bg-slate-700"
        >
          <Text className="text-white font-semibold text-sm">
            ⚙️ Відкрити вкладку налаштувань
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
