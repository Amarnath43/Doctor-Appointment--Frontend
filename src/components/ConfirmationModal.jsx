import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

const ConfirmationModal = ({
  isOpen, title, message, onConfirm, onCancel,
  isConfirming = false, variant = "primary",
  confirmText = "Confirm", cancelText = "Cancel",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  if (!isOpen) return null;

  const primary = "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400";
  const destructive = "bg-red-600 hover:bg-red-700 disabled:bg-red-400";
  const confirmBtn = variant === "destructive" ? destructive : primary;


  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop (its own layer) */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" onClick={onCancel} />
      {/* Dialog above backdrop */}
      <div className="relative z-[1001] bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} disabled={isConfirming}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} disabled={isConfirming}
            className={`px-5 py-2.5 rounded-lg text-white font-semibold transition-colors flex items-center justify-center min-w-[120px] disabled:cursor-not-allowed ${confirmBtn}`}>
            {isConfirming ? <Loader2 className="h-5 w-5 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
