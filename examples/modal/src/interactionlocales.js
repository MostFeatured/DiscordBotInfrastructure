const dbi = require("../dbi");

dbi.register(({ InteractionLocale })=>{
    InteractionLocale({
        name: "cinsiyet seç",
        data: {
            en: {
                name: "select gender",
                description: "Allows you to select a gender.",
                options: {
                    cinsiyet: {
                        name: "gender",
                        description: "Select your gender correctly.",
                        choices: {
                            "Erkek": "Male",
                            "Kadın": "Female",
                            "Diğer": "Other"
                        }
                    }
                }
            }
        }
    });
});