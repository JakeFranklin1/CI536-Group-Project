module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
                document: "readonly",
                window: "readonly",
                setTimeout: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": ["warn", { allow: ["warn", "error", "log"] }],
            semi: ["error", "always"],
        },
    },
];
