import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Sign up — YPPReady" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <AuthShell title={dict.auth.signupTitle} subtitle={dict.auth.signupSubtitle}>
      <SignupForm dict={dict} lang={lang} />
    </AuthShell>
  );
}
