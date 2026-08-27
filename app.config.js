import "dotenv/config";

export default {
  expo: {
    plugins: ["@react-native-community/datetimepicker"],

    name: "BeautySalon",
    slug: "my-app",
    orientation: "portrait",

    extra: {
      API_EMPLOYEE_DATA_UPDATE: process.env.API_EMPLOYEE_DATA_UPDATE,
      // Siguria & autorizimi
      API_AUTHENTICATION_LOGIN: process.env.API_AUTHENTICATION_LOGIN,
      API_AUTHENTICATION_REFRESH_TOKEN:
        process.env.API_AUTHENTICATION_REFRESH_TOKEN,
      API_AUTHENTICATION_VALIDATE: process.env.API_AUTHENTICATION_VALIDATE,

      // Orari + operacione tjera
      API_EMPLOYEE_DATA: process.env.API_EMPLOYEE_DATA,
      API_EMPLOYEE_SET_AVAILABLE_DATES:
        process.env.API_EMPLOYEE_SET_AVAILABLE_DATES,
      API_EMPLOYEE_GET_AVAILABLE_DATES:
        process.env.API_EMPLOYEE_GET_AVAILABLE_DATES,
      API_EMPLOYEE_UPDATE_AVAILABLE_DATES:
        process.env.API_EMPLOYEE_UPDATE_AVAILABLE_DATES,
      API_EMPLOYEE_DELETE_AVAILABLE_DATES:
        process.env.API_EMPLOYEE_DELETE_AVAILABLE_DATES,

      API_TERMINET_GET: process.env.API_TERMINET_GET,

      API_SKILLS_ADD: process.env.API_SKILLS_ADD,
      API_SKILLS_GET_ALL: process.env.API_SKILLS_GET_ALL,
      API_SKILLS_GET_ID: process.env.API_SKILLS_GET_ID,
      API_SKILLS_UPDATE: process.env.API_SKILLS_UPDATE,
      API_SKILLS_DELETE: process.env.API_SKILLS_DELETE,

      API_SHERBIMET_ALL: process.env.API_SHERBIMET_ALL,
      API_SHERBIMET_ATRIBUTET: process.env.API_SHERBIMET_ATRIBUTET,
    },
  },
};
