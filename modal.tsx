// src/components/ui/modal.tsx
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 40 }}
              />
            </Dialog.Overlay>

            <Dialog.Content
  className="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-900 p-6 shadow-xl focus:outline-none"
  aria-describedby="dialog-description"
>
  <div className="flex items-center justify-between mb-4">
    <Dialog.Title className="text-lg font-semibold text-white">
      {title}
    </Dialog.Title>
    <Dialog.Close className="text-gray-400 hover:text-white transition">
      <X className="w-5 h-5" />
    </Dialog.Close>
  </div>

  <Dialog.Description id="dialog-description" className="text-sm text-gray-300">
    {children}
  </Dialog.Description>
</Dialog.Content>

          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
