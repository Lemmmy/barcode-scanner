import { useState } from "react";
import { Copy, Share2, Edit3, Check } from "lucide-react";
import { copyToClipboard, shareText } from "../lib/utils";
import ConnectionStatus from "./ConnectionStatus";

interface RoomCodeDisplayProps {
  code: string | null;
  connected: boolean;
  onChangeCode: () => void;
}

export default function RoomCodeDisplay({ code, connected, onChangeCode }: RoomCodeDisplayProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await copyToClipboard(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      await shareText(code, "Room Code");
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleChangeCode = () => {
    setShowMenu(false);
    onChangeCode();
  };

  return (
    <>
      <button
        onClick={() => code && setShowMenu(true)}
        className="flex items-center gap-3 rounded-lg bg-black/50 px-3 h-[48px] font-mono text-3xl font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:bg-black/70 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!code}
      >
        {code || "----"}
        <ConnectionStatus connected={connected} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-2 shadow-2xl">
            <MenuButton
              icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              onClick={() => void handleCopy()}
            >
              {copied ? "Copied!" : "Copy Code"}
            </MenuButton>
            <MenuButton icon={<Share2 className="h-5 w-5" />} onClick={() => void handleShare()}>
              Share Code
            </MenuButton>
            <MenuButton icon={<Edit3 className="h-5 w-5" />} onClick={handleChangeCode}>
              Change Code
            </MenuButton>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full rounded-lg px-4 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function MenuButton({ icon, onClick, children }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-semibold text-gray-900 transition-colors hover:bg-gray-100 active:bg-gray-200"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
