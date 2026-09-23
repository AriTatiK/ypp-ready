import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Log in — YPPReady" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const [lang, params] = await Promise.all([getLang(), searchParams]);
  const dict = getDictionary(lang);

  return (
    <AuthShell title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle}>
      <LoginForm dict={dict} next={params.next} />
    </AuthShell>
  );
}
