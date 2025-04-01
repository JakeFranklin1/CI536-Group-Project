/**
 * @module config
 * @description Configuration values for the application
 */

const config = {
    apiUrl: {
        development: "http://localhost:3000",
        production: "https://gamestore-backend-9v90.onrender.com",
    },
    defaultGameCover: "../assets/images/placeholder-game.webp",
    specialGameCovers: {
        "grand theft auto v": "../assets/images/gta5.webp",
        "gta v": "../assets/images/gta5.webp",
        "gta 5": "../assets/images/gta5.webp",
        "grand theft auto: san andreas": "../assets/images/gta4.jpg",
        "gta iv": "../assets/images/gta4.jpg",
        "gta 4": "../assets/images/gta4.jpg",
    },
    prices: ["59.99", "49.99", "39.99", "29.99", "19.99"],
};

export default config;
