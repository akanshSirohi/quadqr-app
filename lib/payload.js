export const PAYLOAD_TYPES = [
  { id: "link", label: "Link" },
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "phone", label: "Phone" }
];

export function buildPayload(type, values) {
  switch (type) {
    case "link": {
      const value = (values.url || "").trim();
      if (!value) throw new Error("Enter a link first.");
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    }
    case "email": {
      const email = (values.email || "").trim();
      if (!email) throw new Error("Enter an email address first.");
      const params = new URLSearchParams();
      if (values.subject?.trim()) params.set("subject", values.subject.trim());
      if (values.message?.trim()) params.set("body", values.message.trim());
      const query = params.toString();
      return `mailto:${email}${query ? `?${query}` : ""}`;
    }
    case "sms": {
      const phone = (values.phone || "").trim();
      if (!phone) throw new Error("Enter a phone number first.");
      const message = values.smsMessage?.trim();
      return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ""}`;
    }
    case "phone": {
      const phone = (values.phone || "").trim();
      if (!phone) throw new Error("Enter a phone number first.");
      return `tel:${phone}`;
    }
    case "text":
    default: {
      const text = values.text || "";
      if (!text.trim()) throw new Error("Enter some text first.");
      return text;
    }
  }
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function classifyPayload(rawValue) {
  const raw = String(rawValue ?? "").trim();

  if (/^https?:\/\//i.test(raw)) {
    return {
      type: "link",
      label: "Link",
      title: "Link found",
      display: raw,
      copyValue: raw,
      actionLabel: "Open link",
      actionHref: raw
    };
  }

  if (/^mailto:/i.test(raw)) {
    const body = raw.slice(7);
    const [address, query = ""] = body.split("?");
    const params = new URLSearchParams(query);
    return {
      type: "email",
      label: "Email",
      title: "Email found",
      display: safeDecode(address),
      detail: [
        params.get("subject") ? `Subject: ${params.get("subject")}` : "",
        params.get("body") || ""
      ].filter(Boolean).join("\n"),
      copyValue: safeDecode(address),
      actionLabel: "Compose email",
      actionHref: raw
    };
  }

  if (/^(sms:|smsto:)/i.test(raw)) {
    const isSmsto = /^smsto:/i.test(raw);
    let phone = "";
    let message = "";
    if (isSmsto) {
      const rest = raw.slice(6);
      const splitAt = rest.indexOf(":");
      phone = splitAt >= 0 ? rest.slice(0, splitAt) : rest;
      message = splitAt >= 0 ? rest.slice(splitAt + 1) : "";
    } else {
      const rest = raw.slice(4);
      const [number, query = ""] = rest.split("?");
      phone = number;
      message = new URLSearchParams(query).get("body") || "";
    }
    return {
      type: "sms",
      label: "SMS",
      title: "Message found",
      display: safeDecode(phone),
      detail: safeDecode(message),
      copyValue: safeDecode(message || phone),
      actionLabel: "Send message",
      actionHref: raw
    };
  }

  if (/^tel:/i.test(raw)) {
    const phone = safeDecode(raw.slice(4));
    return {
      type: "phone",
      label: "Phone",
      title: "Phone number found",
      display: phone,
      copyValue: phone,
      actionLabel: "Call",
      actionHref: raw
    };
  }

  return {
    type: "text",
    label: "Text",
    title: "Text found",
    display: raw,
    copyValue: raw,
    actionLabel: null,
    actionHref: null
  };
}
