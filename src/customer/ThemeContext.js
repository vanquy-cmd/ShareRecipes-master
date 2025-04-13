"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ThemeContext = createContext(undefined)

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme()
  const [theme, setTheme] = useState("light")

  // Load saved theme on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("@app_theme")
        if (savedTheme) {
          setTheme(savedTheme)
        } else {
          // Use device theme as default if no saved preference
          setTheme(deviceTheme === "dark" ? "dark" : "light")
        }
      } catch (error) {
        console.error("Failed to load theme", error)
      }
    }

    loadTheme()
  }, [deviceTheme])

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("@app_theme", theme)
      } catch (error) {
        console.error("Failed to save theme", error)
      }
    }

    saveTheme()
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
