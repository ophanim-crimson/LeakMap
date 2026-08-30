import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "LeakMap": "LeakMap",
      "Home": "Home",
      "Dashboard": "Dashboard",
      "Login": "Login",
      "Register": "Register",
      "Logout": "Logout",
      "Language": "Language",
      "Total Reports": "Total Reports",
      "Active": "Active",
      "Resolved": "Resolved",
      "Recent Anonymous Reports": "Recent Anonymous Reports",
      "Submit a Report": "Submit a Report",
      "My Reports": "My Reports",
      "Reports within 100m": "Reports within 100m",
      "Admin Dashboard": "Admin Dashboard",
      "Map View": "Map View",
      "List View": "List View",
      "Status": "Status",
      "Urgency": "Urgency",
      "Date": "Date",
      "Issue Type": "Issue Type",
      "Description": "Description",
      "Photo": "Photo",
      "AI Verification": "AI Verification",
      "Add Comment": "Add Comment to Admin",
      "Comments": "Comments",
      "Submit Comment": "Submit Comment",
      "No reports found.": "No reports found.",
      "Email": "Email",
      "Password": "Password",
      "Don't have an account?": "Don't have an account?",
      "Already have an account?": "Already have an account?",
      "Toggle language": "Toggle language"
    }
  },
  ml: {
    translation: {
      "LeakMap": "ലീക്ക്മാപ്പ്",
      "Home": "ഹോം",
      "Dashboard": "ഡാഷ്ബോർഡ്",
      "Login": "ലോഗിൻ",
      "Register": "രജിസ്റ്റർ ചെയ്യുക",
      "Logout": "ലോഗൗട്ട്",
      "Language": "ഭാഷ",
      "Total Reports": "ആകെ റിപ്പോർട്ടുകൾ",
      "Active": "സജീവം",
      "Resolved": "പരിഹരിച്ചു",
      "Recent Anonymous Reports": "സമീപകാല അജ്ഞാത റിപ്പോർട്ടുകൾ",
      "Submit a Report": "ഒരു റിപ്പോർട്ട് സമർപ്പിക്കുക",
      "My Reports": "എൻ്റെ റിപ്പോർട്ടുകൾ",
      "Reports within 100m": "100 മീറ്ററിനുള്ളിലെ റിപ്പോർട്ടുകൾ",
      "Admin Dashboard": "അഡ്മിൻ ഡാഷ്ബോർഡ്",
      "Map View": "മാപ്പ് വ്യൂ",
      "List View": "ലിസ്റ്റ് വ്യൂ",
      "Status": "അവസ്ഥ",
      "Urgency": "മുൻഗണന",
      "Date": "തീയതി",
      "Issue Type": "പ്രശ്ന തരം",
      "Description": "വിവരണം",
      "Photo": "ഫോട്ടോ",
      "AI Verification": "AI പരിശോധന",
      "Add Comment": "അഡ്മിന് അഭിപ്രായം ചേർക്കുക",
      "Comments": "അഭിപ്രായങ്ങൾ",
      "Submit Comment": "അഭിപ്രായം സമർപ്പിക്കുക",
      "No reports found.": "റിപ്പോർട്ടുകളൊന്നും കണ്ടെത്തിയില്ല.",
      "Email": "ഇമെയിൽ",
      "Password": "പാസ്‌വേഡ്",
      "Don't have an account?": "അക്കൗണ്ട് ഇല്ലേ?",
      "Already have an account?": "നേരത്തെ അക്കൗണ്ട് ഉണ്ടോ?",
      "Toggle language": "ഭാഷ മാറ്റുക",
      "Community Water Intelligence": "സാമൂഹിക ജല നിരീക്ഷണം",
      "Help identify, verify, and monitor water leaks, supply shortages, and broken taps in your local community.": "നിങ്ങളുടെ പ്രദേശത്തെ ജല ചോർച്ചകളും, ജലക്ഷാമവും, തകർന്ന ടാപ്പുകളും കണ്ടെത്താനും പരിശോധിക്കാനും നിരീക്ഷിക്കാനും സഹായിക്കുക.",
      "Report Issue": "പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക",
      "Issue Map": "പ്രശ്ന മാപ്പ്",
      "DESCRIPTION": "വിവരണം",
      "Location Map": "ലൊക്കേഷൻ മാപ്പ്"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
