/**
 * @module game-service
 * @description Service for handling game data operations
 */

import config from "../config.js";
import { escapeHTML } from "../utils/sanitise.js";

/**
 * Global axios from CDN
 * @type {import('axios').AxiosStatic}
 */
const axios = window.axios;

const API_URL =
    window.location.hostname === "localhost"
        ? config.apiUrl.development
        : config.apiUrl.production;

/**
 * Fetch games from the API
 * @param {number} limit - Number of games to fetch
 * @returns {Promise<Array>} - Games data
 */
export async function fetchGames(limit) {
    try {
        const response = await axios.get(`${API_URL}/api/games?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching games:", error);
        throw error;
    }
}

/**
 * Get appropriate cover URL for a game
 * @param {Object} game - Game data
 * @returns {string} - URL for game cover image
 */
export function getCoverUrl(game) {
    // Check for special cases (GTA games)
    const gameName = game.name?.toLowerCase();
    if (gameName) {
        for (const [key, value] of Object.entries(config.specialGameCovers)) {
            if (gameName.includes(key)) {
                return value;
            }
        }
    }

    // Use IGDB cover or default
    return game.cover?.url
        ? game.cover.url
              .replace("t_thumb", "t_720p")
              .replace("t_cover_big", "t_720p")
              .replace("t_cover_big_2x", "t_720p")
              .replace("http:", "https:")
        : config.defaultGameCover;
}

/**
 * Generates a random price for demo purposes
 * @returns {string} - Formatted price string
 */
export function generateRandomPrice() {
    return config.prices[Math.floor(Math.random() * config.prices.length)];
}

/**
 * Converts platform names to corresponding icon images
 * @param {Array} platforms - Array of platform objects
 * @returns {string} - HTML string of platform icons
 */
export function getPlatformIcons(platforms = []) {
    // Common platform name parts and their corresponding icons
    const platformIcons = {
        PC: "../assets/icons/windows.svg",
        PlayStation: "../assets/icons/playstation.svg",
        "PlayStation 4": "../assets/icons/playstation.svg",
        "PlayStation 5": "../assets/icons/playstation.svg",
        "PlayStation 3": "../assets/icons/playstation.svg",
        Xbox: "../assets/icons/xbox.svg",
        "Xbox One": "../assets/icons/xbox.svg",
        "Xbox Series X": "../assets/icons/xbox.svg",
        "Xbox Series S": "../assets/icons/xbox.svg",
        "Nintendo Switch": "../assets/icons/nintendo.svg",
        Nintendo: "../assets/icons/nintendo.svg",
        "Wii U": "../assets/icons/nintendo.svg",
        Wii: "../assets/icons/nintendo.svg",
        iOS: "../assets/icons/apple.svg",
        Mac: "../assets/icons/apple.svg",
        Android: "../assets/icons/android.svg",
    };

    // Used icons for unique platforms to avoid duplicates
    const usedIcons = new Set();

    // Map each platform to an icon, avoiding duplicates
    return platforms
        .map((platform) => {
            // Try exact match first
            let iconPath = platformIcons[platform.name];

            // If no exact match, try partial match
            if (!iconPath) {
                if (platform.name.includes("PlayStation")) {
                    iconPath = "../assets/icons/playstation.svg";
                } else if (platform.name.includes("Xbox")) {
                    iconPath = "../assets/icons/xbox.svg";
                } else if (
                    platform.name.includes("Nintendo") ||
                    platform.name.includes("Wii") ||
                    platform.name.includes("Switch")
                ) {
                    iconPath = "../assets/icons/nintendo.svg";
                } else if (
                    platform.name.includes("PC") ||
                    platform.name.includes("Windows")
                ) {
                    iconPath = "../assets/icons/windows.svg";
                } else if (
                    platform.name.includes("Mac") ||
                    platform.name.includes("iOS") ||
                    platform.name.includes("Apple")
                ) {
                    iconPath = "../assets/icons/apple.svg";
                } else if (platform.name.includes("Android")) {
                    iconPath = "../assets/icons/android.svg";
                } else {
                    // Default fallback
                    iconPath = "../assets/icons/windows.svg";
                }
            }

            // Check if we've already used this icon type (to avoid duplicates)
            if (usedIcons.has(iconPath)) {
                return "";
            }

            // Add to used icons
            usedIcons.add(iconPath);
            return `<img src="${escapeHTML(iconPath)}" alt="${escapeHTML(platform.name)}" class="platform-icon">`;
        })
        .filter((icon) => icon !== ""); // Remove empty strings (duplicates)
}
