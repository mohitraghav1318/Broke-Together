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
      "Use this guide when you want to change your display name or username.",
    steps: [
      "Sign in to your Broke Together account.",
      "Open My account from the navbar or the home page account panel.",
      "Update your display name or choose an available username.",
      "Save the change and look for the profile updated message.",
    ],
    note: "Email and password changes are not available yet. For now, profile updates cover display name and username.",
  },
  {
    id: "delete-account",
    title: "Delete your account",
    summary:
      "Deleting an account should remove your sign-in access and any personal account data connected to it.",
    steps: [
      "Sign in to the account you want to delete.",
      "Open My account from the navbar or the home page account panel.",
      "Review what will be removed before confirming.",
      "Confirm deletion only when you are sure, because this action should not be reversible.",
    ],
    note: "Firebase may require you to sign in again before deleting your account.",
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
