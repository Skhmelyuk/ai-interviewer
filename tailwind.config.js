/** @type {import('tailwindcss').Config} */
module.exports = {
  // Шляхи до файлів, де використовуватимуться класи Tailwind (з урахуванням src/)
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // Основний синій акцент
          dark: "#1D4ED8",
          light: "#60A5FA",
        },
        background: {
          dark: "#0F172A", // Темний фон екранів (Slate 900)
          card: "#1E293B", // Фон карток (Slate 800)
          elevated: "#334155",
        },
        accent: {
          success: "#10B981", // Зелений (успішна відповідь)
          warning: "#F59E0B", // Помаранчевий (зауваження)
          danger: "#EF4444", // Червоний (помилка)
          purple: "#8B5CF6", // Фіолетовий (бейджі AI)
        },
      },
    },
  },
  plugins: [],
};
