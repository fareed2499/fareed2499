import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Precision — Calculator" },
      {
        name: "description",
        content:
          "A frosted-glass precision calculator with keyboard support, live expression preview, and instant results.",
      },
      { property: "og:title", content: "Precision — Calculator" },
      {
        property: "og:description",
        content:
          "A frosted-glass precision calculator with keyboard support, live expression preview, and instant results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalculatorPage,
});

type Operator = "+" | "−" | "×" | "÷";

const OP_MAP: Record<Operator, (a: number, b: number) => number> = {
  "+": (a, b) => a + b,
  "−": (a, b) => a - b,
  "×": (a, b) => a * b,
  "÷": (a, b) => (b === 0 ? NaN : a / b),
};

function formatNumber(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return "Error";
  const rounded = Math.round(n * 1e10) / 1e10;
  const [int, dec] = String(rounded).split(".");
  const grouped = Number(int).toLocaleString("en-US");
  return dec ? `${grouped}.${dec}` : grouped;
}

function formatDisplay(raw: string): string {
  if (raw === "Error") return raw;
  const [int, dec] = raw.split(".");
  const grouped = int === "" || int === "-" ? int || "0" : Number(int).toLocaleString("en-US");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

interface CalcState {
  current: string;
  previous: number | null;
  operator: Operator | null;
  justEvaluated: boolean;
}

const INITIAL: CalcState = { current: "0", previous: null, operator: null, justEvaluated: false };

function CalculatorPage() {
  const [state, setState] = useState<CalcState>(INITIAL);

  const inputDigit = useCallback((digit: string) => {
    setState((s) => {
      if (s.current === "Error" || s.justEvaluated) {
        return { ...INITIAL, current: digit };
      }
      if (s.current.replace(/[-.]/g, "").length >= 12) return s;
      return { ...s, current: s.current === "0" ? digit : s.current + digit };
    });
  }, []);

  const inputDot = useCallback(() => {
    setState((s) => {
      if (s.current === "Error" || s.justEvaluated) return { ...INITIAL, current: "0." };
      if (s.current.includes(".")) return s;
      return { ...s, current: s.current + "." };
    });
  }, []);

  const applyOperator = useCallback((op: Operator) => {
    setState((s) => {
      if (s.current === "Error") return s;
      const value = parseFloat(s.current);
      if (s.previous !== null && s.operator && !s.justEvaluated) {
        const result = OP_MAP[s.operator](s.previous, value);
        if (Number.isNaN(result) || !Number.isFinite(result)) {
          return { ...INITIAL, current: "Error" };
        }
        return { current: String(result), previous: result, operator: op, justEvaluated: true };
      }
      return { ...s, previous: value, operator: op, justEvaluated: true };
    });
  }, []);

  const evaluate = useCallback(() => {
    setState((s) => {
      if (s.current === "Error" || s.previous === null || !s.operator) return s;
      const result = OP_MAP[s.operator](s.previous, parseFloat(s.current));
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return { ...INITIAL, current: "Error" };
      }
      return { current: String(result), previous: null, operator: null, justEvaluated: true };
    });
  }, []);

  const clearAll = useCallback(() => setState(INITIAL), []);

  const backspace = useCallback(() => {
    setState((s) => {
      if (s.current === "Error" || s.justEvaluated) return INITIAL;
      const next = s.current.slice(0, -1);
      return { ...s, current: next === "" || next === "-" ? "0" : next };
    });
  }, []);

  const negate = useCallback(() => {
    setState((s) => {
      if (s.current === "Error" || s.current === "0") return s;
      return {
        ...s,
        current: s.current.startsWith("-") ? s.current.slice(1) : "-" + s.current,
      };
    });
  }, []);

  const percent = useCallback(() => {
    setState((s) => {
      if (s.current === "Error") return s;
      return { ...s, current: String(parseFloat(s.current) / 100) };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === "." || e.key === ",") inputDot();
      else if (e.key === "+") applyOperator("+");
      else if (e.key === "-") applyOperator("−");
      else if (e.key === "*" || e.key === "x") applyOperator("×");
      else if (e.key === "/") {
        e.preventDefault();
        applyOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        evaluate();
      } else if (e.key === "Backspace") backspace();
      else if (e.key === "Escape") clearAll();
      else if (e.key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDot, applyOperator, evaluate, backspace, clearAll, percent]);

  const expression =
    state.previous !== null && state.operator
      ? `${formatNumber(state.previous)} ${state.operator}`
      : "";

  const display = formatDisplay(state.current);
  const [intPart, decPart] = display.split(".");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 font-sans text-foreground antialiased sm:p-8">
      {/* Ambient glows */}
      <div className="glow-pulse pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-24 right-[-140px] h-[460px] w-[460px] rounded-full bg-glow-blue/18 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/3 h-[380px] w-[380px] rounded-full bg-glow-violet/16 blur-[120px]" />

      <div className="relative w-full max-w-[430px] rounded-[min(6vw,30px)] bg-white/8 p-4 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/15 backdrop-blur-2xl sm:p-5">
        {/* Status bar */}
        <div className="flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_2px] shadow-accent/70" />
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Precision
            </span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            12 sig
          </span>
        </div>

        {/* Display */}
        <div className="mb-4 rounded-[min(5vw,22px)] bg-background/70 px-5 py-6 ring-1 ring-white/8 backdrop-blur-xl">
          <div className="flex h-5 justify-end">
            <span className="text-[13px] font-medium tracking-wide text-muted-foreground">
              {expression}
            </span>
          </div>
          <div
            key={display}
            className="display-pop mt-1 flex items-baseline justify-end overflow-hidden font-grotesk"
          >
            <span className="text-[40px] leading-none font-semibold tracking-tight tabular-nums">
              {intPart}
            </span>
            {decPart !== undefined && (
              <span className="ml-0.5 text-[40px] leading-none font-medium text-accent">
                .{decPart}
              </span>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {state.current === "Error" ? "Overflow" : "Result"}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2.5">
          <Key label="AC" variant="fn" onClick={clearAll} />
          <Key label="±" variant="fn" onClick={negate} />
          <Key label="%" variant="fn" onClick={percent} />
          <Key label="÷" variant="op" active={state.operator === "÷"} onClick={() => applyOperator("÷")} />

          <Key label="7" onClick={() => inputDigit("7")} />
          <Key label="8" onClick={() => inputDigit("8")} />
          <Key label="9" onClick={() => inputDigit("9")} />
          <Key label="×" variant="op" active={state.operator === "×"} onClick={() => applyOperator("×")} />

          <Key label="4" onClick={() => inputDigit("4")} />
          <Key label="5" onClick={() => inputDigit("5")} />
          <Key label="6" onClick={() => inputDigit("6")} />
          <Key label="−" variant="op" active={state.operator === "−"} onClick={() => applyOperator("−")} />

          <Key label="1" onClick={() => inputDigit("1")} />
          <Key label="2" onClick={() => inputDigit("2")} />
          <Key label="3" onClick={() => inputDigit("3")} />
          <Key label="+" variant="op" active={state.operator === "+"} onClick={() => applyOperator("+")} />

          <Key label="0" onClick={() => inputDigit("0")} />
          <Key label="." onClick={inputDot} />
          <Key label="⌫" variant="fn" onClick={backspace} />
          <Key label="=" variant="eq" onClick={evaluate} />
        </div>

        {/* Page dots */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <span className="size-1 rounded-full bg-white/20" />
          <span className="size-1 rounded-full bg-white/20" />
          <span className="size-1 rounded-full bg-accent/70" />
        </div>
      </div>
    </div>
  );
}

interface KeyProps {
  label: string;
  onClick: () => void;
  variant?: "digit" | "fn" | "op" | "eq";
  active?: boolean;
}

function Key({ label, onClick, variant = "digit", active = false }: KeyProps) {
  const base =
    "key-btn flex h-[60px] items-center justify-center rounded-[min(3vw,15px)] ring-1 backdrop-blur-md sm:h-[62px]";
  const styles: Record<NonNullable<KeyProps["variant"]>, string> = {
    digit: "bg-key/80 text-[19px] font-medium text-foreground ring-white/10",
    fn: "bg-white/6 text-[15px] font-medium text-muted-foreground ring-white/10",
    op: `text-[19px] font-medium ring-accent/50 ${
      active ? "bg-accent text-accent-foreground" : "bg-accent/25 text-accent"
    }`,
    eq: "bg-amber text-[22px] font-semibold text-background ring-amber shadow-[0_0_26px_-4px] shadow-amber/70",
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[variant]}`}>
      {label}
    </button>
  );
}
