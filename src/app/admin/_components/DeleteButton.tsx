"use client";

export default function DeleteButton({
  action,
  id,
  confirmMessage,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  confirmMessage: string;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-terracotta-600 hover:underline">
        {label}
      </button>
    </form>
  );
}
