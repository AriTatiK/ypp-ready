import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset password — YPPReady" };

export default async function ForgotPasswordPage() {
  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <AuthShell title={dict.auth.forgotPasswordTitle}>
      <ForgotPasswordForm dict={dict} />
    </AuthShell>
  );
}
