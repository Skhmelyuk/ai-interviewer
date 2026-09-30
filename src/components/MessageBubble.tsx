import { ChatMessage } from "@/types";
import { Text, View } from "react-native";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      className={`my-2 flex-row ${isUser ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-md ${
          isUser
            ? "bg-primary rounded-br-none"
            : "bg-background-card border border-slate-700/80 rounded-bl-none"
        }`}
      >
        <Text
          className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${
            isUser ? "text-blue-200" : "text-accent-purple"
          }`}
        >
          {isUser ? "Ви (Кандидат)" : "🤖 Tech Lead"}
        </Text>

        <Text
          className={`text-sm leading-relaxed ${isUser ? "text-white" : "text-slate-100"}`}
        >
          {message.content}
        </Text>

        <Text
          className={`text-[9px] mt-1 text-right ${isUser ? "text-blue-200/70" : "text-slate-400"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}
