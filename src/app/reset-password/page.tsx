import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Choose a new password — YPPReady" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [lang, params] = await Promise.all([getLang(), searchParams]);
  const dict = getDictionary(lang);
  const token = params.token ?? "";

  return (
    <AuthShell title={dict.auth.resetPasswordTitle}>
      {token ? (
        <ResetPasswordForm dict={dict} token={token} />
      ) : (
        <p className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta-600">
          {dict.auth.errors.tokenInvalid}
        </p>
      )}
    </AuthShell>
  );
}
