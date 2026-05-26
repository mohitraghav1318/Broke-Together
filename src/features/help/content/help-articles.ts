export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  note?: string;
};

export const helpArticles: HelpArticle[] = [
  {
    id: "update-account",
    title: "Update your account",
    summary:
      "Use this guide when you want to change your name, email, password, or sign-in method.",
    steps: [
      "Sign in to your Broke Together account.",
      "Open Account Settings when the settings area is added to the app.",
      "Choose the detail you want to update, such as name, email, or password.",
      "Save the change and sign in again if Firebase asks you to confirm your identity.",
    ],
    note: "Account settings are not built yet. For now, keep using the email or Google account you signed up with.",
  },
  {
    id: "delete-account",
    title: "Delete your account",
    summary:
      "Deleting an account should remove your sign-in access and any personal account data connected to it.",
    steps: [
      "Sign in to the account you want to delete.",
      "Open Account Settings when account deletion is added.",
      "Review what will be removed before confirming.",
      "Confirm deletion only when you are sure, because this action should not be reversible.",
    ],
    note: "Deletion controls are planned for a later version. Until then, do not store sensitive real expense data in the app.",
  },
  {
    id: "sign-in-help",
    title: "Trouble signing in",
    summary:
      "Try these quick checks if email, password, or Google sign-in does not work.",
    steps: [
      "Check that you are using the same sign-in method you used when creating the account.",
      "For email login, make sure the password has at least 6 characters.",
      "For Google login, allow the popup window if your browser blocks it.",
      "If the issue continues, sign out, refresh the page, and try again.",
    ],
  },
];
