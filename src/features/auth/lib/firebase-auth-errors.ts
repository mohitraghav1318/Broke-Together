export function getFriendlyAuthError(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is not correct.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window.";
    default:
      return "Something went wrong. Please try again.";
  }
}
