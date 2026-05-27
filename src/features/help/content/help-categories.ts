export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  note?: string;
};

export type HelpCategory = {
  id: string;
  title: string;
  articles: HelpArticle[];
};

export const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    articles: [
      {
        id: "what-is-broke-together",
        title: "What is Broke Together?",
        summary:
          "Learn how Broke Together helps you track shared expenses simply and transparently.",
        steps: [
          "Broke Together allows you to create 'Notebooks' for trips, roomates, or events.",
          "Invite friends to your notebook so everyone can see and log expenses.",
          "Log what you paid for, and split the cost appropriately.",
          "Check the generated report anytime to see who owes what.",
        ],
      },
    ],
  },
  {
    id: "notebooks",
    title: "Notebooks & Expenses",
    articles: [
      {
        id: "create-notebook",
        title: "Create a Notebook",
        summary: "Learn how to start a new notebook to track shared costs.",
        steps: [
          "From the top navigation, click on 'Notebooks' to view your dashboard.",
          "Click the 'New notebook' button to create a new shared space.",
          "Give the notebook a memorable name (like 'Paris Trip' or 'Apartment 4B').",
          "Your notebook is ready—now you can invite friends and add your first expenses.",
        ],
      },
      {
        id: "invite-friends",
        title: "Invite Friends",
        summary:
          "Add people to your notebook so you can split costs with them.",
        steps: [
          "Open the notebook you want to share.",
          "Locate the 'Add friend' section on the right side of the screen.",
          "Enter your friend's name and add them to the notebook.",
          "Note: Only friends added to the notebook can be selected when splitting an expense.",
        ],
      },
      {
        id: "add-expense",
        title: "Adding an Expense",
        summary: "Record a new payment and choose who is involved.",
        steps: [
          "Inside your notebook, click 'Add new entry'.",
          "Enter what the expense was for, the amount, who paid, and the category.",
          "Select the friends who should share the cost of this specific expense.",
          "Save the entry. Everyone's balance will update automatically.",
        ],
      },
      {
        id: "view-report",
        title: "View the Settlement Report",
        summary: "Check who owes what securely and settle up correctly.",
        steps: [
          "In your notebook, click the 'View settlement report' button at the top.",
          'The report clearly shows "Who owes whom" avoiding messy duplicate payments.',
          "Each person's total spending and expected contribution is summarized below.",
        ],
        note: "Settling up outside the app (e.g. Venmo or Cash) is required. Once settled, you can manually delete or clear the entries if you prefer a fresh start.",
      },
    ],
  },
  {
    id: "account-settings",
    title: "Account & Security",
    articles: [
      {
        id: "update-account",
        title: "Update your account",
        summary:
          "Use this guide when you want to change your display name or username.",
        steps: [
          "Sign in to your Broke Together account.",
          "Open your account panel from the dashboard.",
          "Update your display name or choose an available username.",
          "Save the change and look for the profile updated message.",
        ],
        note: "Profile updates currently cover your display name and username.",
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
      {
        id: "delete-account",
        title: "Delete your account",
        summary:
          "Deleting an account removes your access and personal connected data.",
        steps: [
          "Sign in to the account you want to delete.",
          "Open your account panel.",
          "Review what will be removed.",
          "Confirm deletion only when you are sure—this is not reversible.",
        ],
        note: "Firebase may require you to sign in again before deleting your account.",
      },
    ],
  },
];
