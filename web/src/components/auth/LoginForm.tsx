"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6; // mínimo por defecto de Supabase Auth

/** Traduce los códigos de error de Supabase Auth a mensajes claros para el estudiante. */
function friendlyError(error: { code?: string; message: string; status?: number }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Aún no has confirmado tu correo. Revisa tu bandeja de entrada.";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese correo. Inicia sesión.";
    case "weak_password":
      return `La contraseña es demasiado débil (mínimo ${MIN_PASSWORD} caracteres).`;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    default:
      return error.status === 0 || /fetch/i.test(error.message)
        ? "No se pudo conectar con el servidor. Revisa tu conexión."
        : "No se pudo completar la acción. Inténtalo de nuevo.";
  }
}

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const errors = {
    email: !email.trim()
      ? "Escribe tu correo."
      : !EMAIL_RE.test(email.trim())
        ? "El correo no tiene un formato válido."
        : undefined,
    password: !password
      ? "Escribe tu contraseña."
      : mode === "signup" && password.length < MIN_PASSWORD
        ? `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
        : undefined,
  };
  const show = (f: keyof typeof errors) => (submitted ? errors[f] : undefined);
  const invalid = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

  function switchMode(next: Mode) {
    setMode(next);
    setSubmitted(false);
    setFormError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setInfo(null);
    if (errors.email || errors.password || !supabaseConfigured) return;

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setFormError(friendlyError(error));
          return;
        }
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setFormError(friendlyError(error));
          return;
        }
        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setInfo("¡Cuenta creada! Te enviamos un correo para confirmarla. Después podrás iniciar sesión.");
          setMode("login");
          setPassword("");
          setSubmitted(false);
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <GraduationCap className="mb-1 size-8" />
          <CardTitle className="text-xl">Gestor Académico</CardTitle>
          <CardDescription>
            {mode === "login" ? "Inicia sesión para ver tus notas" : "Crea tu cuenta de estudiante"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!supabaseConfigured && (
            <p role="alert" className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </p>
          )}
          {info && (
            <p role="status" className="mb-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              {info}
            </p>
          )}
          {formError && (
            <p role="alert" className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {formError}
            </p>
          )}

          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full-name">Nombre (opcional)</Label>
                <Input
                  id="full-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(show("email"))}
                className={show("email") ? invalid : ""}
              />
              {show("email") && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {show("email")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(show("password"))}
                className={show("password") ? invalid : ""}
              />
              {show("password") && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {show("password")}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading || !supabaseConfigured}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
