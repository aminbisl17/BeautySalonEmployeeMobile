
import "dotenv/config";
import appJson from "./app.json";

const { expo: staticExpo } = appJson;

export default {
  expo: {
    ...staticExpo,

    // Keep your existing Expo account and app identity.
    owner: "aminbisl20",
    name: "beautysalonemployeemobile",
    slug: "beautysalonemployeemobile",

    // Preserve static plugins and add the native date-time picker.
    plugins: [
      ...(staticExpo.plugins ?? []),
      "@react-native-community/datetimepicker",
    ],

    ios: {
      ...staticExpo.ios,
      bundleIdentifier: "com.aminbislimaj.beautysalonemployee",
    },

    extra: {
      ...staticExpo.extra,

      eas: {
        ...staticExpo.extra?.eas,
        projectId: "84838d65-e1b6-42f8-a611-7ae56e842325",
      },

      API_EMPLOYEE_DATA_UPDATE: process.env.API_EMPLOYEE_DATA_UPDATE,

      // Authentication
      API_AUTHENTICATION_LOGIN: process.env.API_AUTHENTICATION_LOGIN,
      API_AUTHENTICATION_REFRESH_TOKEN:
        process.env.API_AUTHENTICATION_REFRESH_TOKEN,
      API_AUTHENTICATION_VALIDATE: process.env.API_AUTHENTICATION_VALIDATE,

      // Employee schedule and operations
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

      // Skills
      API_SKILLS_ADD: process.env.API_SKILLS_ADD,
      API_SKILLS_GET_ALL: process.env.API_SKILLS_GET_ALL,
      API_SKILLS_GET_ID: process.env.API_SKILLS_GET_ID,
      API_SKILLS_UPDATE: process.env.API_SKILLS_UPDATE,
      API_SKILLS_DELETE: process.env.API_SKILLS_DELETE,

      // Services
      API_SHERBIMET_ALL: process.env.API_SHERBIMET_ALL,
      API_SHERBIMET_ATRIBUTET: process.env.API_SHERBIMET_ATRIBUTET,

      // WebSocket and tenant
      API_WS: process.env.API_WS,
      TENANT_KEY: process.env.TENANT_KEY,
    },
  },
};
