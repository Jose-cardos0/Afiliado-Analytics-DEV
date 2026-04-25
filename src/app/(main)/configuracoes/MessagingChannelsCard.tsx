"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import EvolutionIntegrationCard from "./EvolutionIntegrationCard";
import TelegramIntegrationCard from "./TelegramIntegrationCard";

type Channel = "whatsapp" | "telegram";

export default function MessagingChannelsCard() {
  const [active, setActive] = useState<Channel>("whatsapp");

  return (
    <div className="space-y-3">
      {/* Sub-abas */}
      <div role="tablist" className="flex gap-1 border-b border-dark-border">
        <TabButton
          active={active === "whatsapp"}
          onClick={() => setActive("whatsapp")}
          icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
          label="WhatsApp"
        />
        <TabButton
          active={active === "telegram"}
          onClick={() => setActive("telegram")}
          icon={<Send className="h-4 w-4 text-sky-400" />}
          label="Telegram"
        />
      </div>

      <div className="animate-in fade-in duration-150">
        {active === "whatsapp" ? <EvolutionIntegrationCard /> : <TelegramIntegrationCard />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "text-text-primary border-shopee-orange"
          : "text-text-secondary border-transparent hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
