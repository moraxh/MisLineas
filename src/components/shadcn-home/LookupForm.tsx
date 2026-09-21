import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Turnstile } from "@/components/home/Turnstile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurpValidationError } from "@/lib/curp";
import { LOCAL_LOOKUP } from "@/lib/local-client";

export function LookupForm({
  curp,
  onChange,
  loading,
  onSubmit,
}: {
  curp: string;
  onChange: (value: string) => void;
  loading: boolean;
  onSubmit: (token: string) => void;
}) {
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const verified = LOCAL_LOOKUP || !!token;
  const error = getCurpValidationError(curp);
  const valid = curp.length === 18 && !error;
  return (
    <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Haz tu consulta</CardTitle>
        <CardDescription>Sin cuenta. Solo necesitas tu CURP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || loading || !verified) return;
            onSubmit(token);
            setToken("");
            setAttempt((value) => value + 1);
          }}
          className="space-y-5"
        >
          <div className="space-y-2.5">
            <Label htmlFor="curp">CURP</Label>
            <Input
              id="curp"
              value={curp}
              onChange={(e) =>
                onChange(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 18),
                )
              }
              placeholder="Ingresa los 18 caracteres"
              className="h-12 text-base md:text-base"
              disabled={loading}
              maxLength={18}
              minLength={18}
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby="curp-help curp-error"
            />
            <div
              id="curp-help"
              className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"
            >
              <span>{curp.length} / 18 caracteres</span>
              <a
                href="https://www.gob.mx/curp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                ¿No la conoces?
                <ArrowUpRight className="size-3" />
              </a>
            </div>
            <p
              id="curp-error"
              role={error ? "alert" : undefined}
              className="text-xs text-destructive"
            >
              {error}
            </p>
          </div>
          {!LOCAL_LOOKUP && !loading && (
            <Turnstile key={attempt} onToken={setToken} />
          )}
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={!valid || loading || !verified}
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" />
                Consultando…
              </>
            ) : (
              <>
                Consultar líneas
                <ArrowRight />
              </>
            )}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Usa tu CURP o una que tengas autorización para revisar.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
