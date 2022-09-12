const dbi = require("../dbi");
dbi.register(({ Locale })=>{
  Locale({
    name: "tr",
    data: {
      genders: {
        erkek: "Erkek",
        kadın: "Kadın",
        diğer: "Diğer",
      },
      modal: {
        title: "İsmin nedir ?",
        label: "İsim",
        text: "Senin adın {0}"
      },
      genderText: "{0} adlı üye {1} cinsiyetini seçti.",
      clickText: "Bana tıkla!",
    }
  });

  Locale({
    name: "en",
    data: {
      genders: {
        erkek: "Male",
        kadın: "Female",
        diğer: "Other"
      },
      modal: {
        title: "What is your name?",
        label: "Name",
        text: "Your name is {0}"
      },
      genderText: "{0}, picked {1} gender.",
      clickText: "Click me!",
    }
  });
});