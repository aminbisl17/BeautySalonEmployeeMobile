import "dotenv/config";

export default {
  expo: {
    plugins: ["@react-native-community/datetimepicker"],

    extra: {
      API_AUTHENTICATION_LOGIN: process.env.API_AUTHENTICATION_LOGIN,
      API_AUTHENTICATION_REFRESH_TOKEN:
        process.env.API_AUTHENTICATION_REFRESH_TOKEN,
      API_AUTHENTICATION_VALIDATE: process.env.API_AUTHENTICATION_VALIDATE,
      API_EMPLOYEE_DATA: process.env.API_EMPLOYEE_DATA,
      API_EMPLOYEE_SET_AVAILABLE_DATES:
        process.env.API_EMPLOYEE_SET_AVAILABLE_DATES,
    },
  },
};
