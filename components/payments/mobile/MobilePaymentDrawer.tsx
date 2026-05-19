"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, AlertTriangle, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "../usePaymentFilters";
import { StatusBadge } from "../StatusBadge";
import { PaymentTimeline } from "../PaymentTimeline";
import { VerificationPanel } from "../VerificationPanel";

interface MobilePaymentDrawerProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkPaid: (id: string, tenantName: string, roomNumber: string) => void;
  onApprovePayment: (id: string, tenantName: string, roomNumber: string) => void;
  onRejectPayment: (id: string, tenantName: string, roomNumber: string, notes: string) => void;
}

const SHEET_HEIGHT = "85vh";
const DISMISS_VELOCITY = 400;
const DISMISS_OFFSET = 120;

const sheetTransition = {
  type: "tween" as const,
  duration: 0.32,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

const backdropTransition = {
  type: "tween" as const,
  duration: 0.28,
  ease: "easeOut" as const,
};

export function MobilePaymentDrawer({
  payment,
  isOpen,
  onClose,
  onMarkPaid,
  onApprovePayment,
  onRejectPayment,
}: MobilePaymentDrawerProps) {
  const [timelinePlay, setTimelinePlay] = useState(false);

  useEffect(() => {
    if (!isOpen || !payment) {
      setTimelinePlay(false);
      return;
    }
    const timer = window.setTimeout(() => setTimelinePlay(true), 360);
    return () => window.clearTimeout(timer);
  }, [isOpen, payment?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleMarkPaid = () => {
    if (!payment) return;
    onMarkPaid(payment.id, payment.tenantName, payment.roomNumber);
  };

  const handleSendReminder = () => {
    alert(`Reminder sent to ${payment?.tenantName} for Room ${payment?.roomNumber}`);
  };

  const timelineSteps = payment
    ? [
        {
          label: "Generated",
          sub: `Due ${new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
          done: true,
        },
        {
          label: "Received",
          sub:
            payment.status === "paid" && payment.paidDate
              ? `Paid ${new Date(payment.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : "Awaiting payment",
          done: payment.status === "paid",
          active: payment.status !== "paid",
        },
      ]
    : [];

  return (
    <AnimatePresence>
      {isOpen && payment && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={sheetTransition}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
                onClose();
              }
            }}
            style={{ height: SHEET_HEIGHT }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-background shadow-2xl overflow-hidden"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="h-1 w-9 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">{payment.tenantName}</h2>
                  <StatusBadge status={payment.status} />
                </div>
                <p className="text-xs text-muted-foreground">Room {payment.roomNumber}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Amount</p>
                  <p className="text-2xl font-bold">₹{payment.amount.toLocaleString()}</p>
                </div>
              </div>

              <PaymentTimeline
                steps={timelineSteps}
                fillComplete={payment.status === "paid"}
                compact
                play={timelinePlay}
              />

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Breakdown
                </h3>
                <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground text-xs">Base Rent</span>
                    <span className="font-medium text-sm">₹{payment.baseRent.toLocaleString()}</span>
                  </div>
                  {payment.extraCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500 flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> Extra Charges
                      </span>
                      <span className="font-medium text-red-500 text-sm">
                        + ₹{payment.extraCharges.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>₹{payment.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="shrink-0 flex flex-col gap-3 px-5 pt-3 pb-3 border-t border-slate-200 dark:border-slate-800 bg-background"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              {payment.status === "submitted" ? (
                <>
                  <VerificationPanel 
                    payment={payment}
                    onApprove={() => {
                      onApprovePayment(payment.id, payment.tenantName, payment.roomNumber);
                      onClose();
                    }}
                    onReject={(notes) => {
                      onRejectPayment(payment.id, payment.tenantName, payment.roomNumber, notes);
                      onClose();
                    }}
                  />
                  {payment.payment_token && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-muted-foreground h-9"
                      onClick={() => {
                        const url = `${window.location.origin}/pay/${payment.payment_token}`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      <Link className="h-4 w-4" />
                      Copy Payment Link
                    </Button>
                  )}
                </>
              ) : payment.status !== "paid" ? (
                <>
                  <div className="flex gap-3">
                    <Button size="sm" variant="ghost" className="flex-1 h-10" onClick={handleSendReminder}>
                      Remind
                    </Button>
                    <Button size="sm" className="flex-1 gap-2 h-10" onClick={handleMarkPaid}>
                      <Check className="h-4 w-4" />
                      Mark as Paid
                    </Button>
                  </div>
                  {payment.payment_token && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-muted-foreground h-9"
                      onClick={() => {
                        const url = `${window.location.origin}/pay/${payment.payment_token}`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      <Link className="h-4 w-4" />
                      Copy Payment Link
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 h-10 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-md font-medium text-sm border border-emerald-300 dark:border-emerald-500/40">
                  <Check className="h-4 w-4" />
                  Payment Completed
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
