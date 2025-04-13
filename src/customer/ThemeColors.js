export const lightColors = {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    primary: "#FF6B00",
    primaryVariant: "rgba(255, 107, 0, 0.1)",
    secondary: "#555555",
    text: "#333333",
    textSecondary: "#666666",
    textTertiary: "#999999",
    border: "#E0E0E0",
    divider: "#EEEEEE",
    card: "#FFFFFF",
    statusBar: "dark-content",
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "#000000",
  }
  
  export const darkColors = {
    background: "#121212",
    surface: "#1E1E1E",
    surfaceVariant: "#2A2A2A",
    primary: "#FF8F3F",
    primaryVariant: "rgba(255, 143, 63, 0.15)",
    secondary: "#BBBBBB",
    text: "#FFFFFF",
    textSecondary: "#DDDDDD",
    textTertiary: "#AAAAAA",
    border: "#3A3A3A",
    divider: "#333333",
    card: "#252525",
    statusBar: "light-content",
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "#000000",
  }
  
  export const getColors = (isDark) => {
    return isDark ? darkColors : lightColors
  }
  