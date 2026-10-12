import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export function Logo({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#2f6cf6" />
      <path fill="#fff" d="M8.2 8h15.2v3.15h-11.4v3.35h9.4v2.9h-9.4v3.45h11.8V24H8.2V8z" />
    </svg>
  );
}

export function GmailMark({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M1.5 5.5h0L12 13.2 22.5 5.5A2 2 0 0 0 20.8 4H3.2a2 2 0 0 0-1.7 1.5z" />
      <path fill="#34A853" d="M22.5 5.6V18a2 2 0 0 1-2 2h-2.2V10.7L12 15.2l-6.3-4.5V20H3.5a2 2 0 0 1-2-2V5.6L12 13.3 22.5 5.6z" />
      <path fill="#FBBC04" d="M1.5 18V6.8L5.7 10v10H3.5a2 2 0 0 1-2-2z" />
      <path fill="#EA4335" d="M22.5 6.8V18a2 2 0 0 1-2 2h-2.2V10L22.5 6.8z" />
    </svg>
  );
}

export function EmailLines({ lines, tone = "default" }) {
  const mine = tone === "mine";
  return (
    <div className="space-y-0.5">
      {lines.map((line, index) => {
        if (line.type === "subject") {
          return (
            <p key={index} className={`text-[12.5px] leading-5 ${mine ? "text-blue-100" : "text-slate-500"}`}>
              Email subject: <span className={mine ? "text-white" : "text-slate-800"}>{line.value}</span>
            </p>
          );
        }
        return (
          <p
            key={index}
            className={`text-[12.5px] leading-5 ${
              mine ? "text-white" : line.strong ? "font-semibold text-slate-800" : "text-slate-600"
            }`}
          >
            {line.value}
          </p>
        );
      })}
    </div>
  );
}

export function BrokerThread({ thread }) {
  return (
    <div className="flex flex-col gap-3">
      {thread.map((message) => {
        const mine = message.from === "me";
        return (
          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 ${
                mine ? "rounded-br-md bg-[#2f6cf6] text-white" : "rounded-bl-md bg-slate-100 text-slate-700"
              }`}
            >
              <div className={`mb-1 text-[11px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
                {mine ? "Dispatcher" : message.name || "Broker"} · {message.time}
              </div>
              <EmailLines lines={message.body} tone={mine ? "mine" : "default"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatusMarks({ quote }) {
  return (
    <span className="flex max-w-[58%] shrink-0 flex-wrap items-center justify-end gap-1">
      {quote.isNew && (
        <span className="rounded-[4px] bg-[#ff3b30] px-1.5 py-[1px] text-[10px] font-bold tracking-wide text-white">
          NEW
        </span>
      )}
      {quote.bidCreated && (
        <span className="rounded-full bg-[#3dce5a] px-2 py-[2px] text-[10.5px] font-semibold text-white">
          BID created
        </span>
      )}
      {quote.offerCreated && (
        <span className="rounded-full border border-[#3dce5a] px-2 py-[2px] text-[10.5px] font-semibold text-[#1f9d45]">
          Offer created
        </span>
      )}
      <GmailMark />
    </span>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2f6cf6] px-4 h-9 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1f58d8] disabled:opacity-50";
export const btnSoft =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#e7f0ff] px-4 h-9 text-[13px] font-semibold text-[#2f6cf6] hover:bg-[#d9e8ff]";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 h-9 text-[13px] font-medium text-slate-600 hover:bg-slate-50";
export const btnQuiet =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-4 h-9 text-[13px] font-medium text-slate-600 hover:bg-slate-200";

export function FieldLabel({ children }) {
  return <div className="mb-1 text-[12px] font-medium text-slate-500">{children}</div>;
}

export function BrokerComposer({ onSend, placeholder = "Write a message" }) {
  const [text, setText] = useState("");
  const fieldRef = useRef(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, 140)}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <form
      className="mt-3 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={fieldRef}
        rows={1}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="max-h-[140px] min-h-9 flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 outline-none"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!text.trim()}
        className="mb-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:text-[#2f6cf6] disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
