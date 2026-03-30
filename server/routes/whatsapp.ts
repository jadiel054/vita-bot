/**
 * HTTP routes for WhatsApp notifications
 * These are direct Express routes, not tRPC
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  sendAppointmentNotification,
  sendCancellationNotification,
  sendPatientConfirmation,
} from "../services/whatsapp";

const router = Router();

// Validation schemas
const notifyAppointmentSchema = z.object({
  patientName: z.string(),
  specialty: z.string(),
  date: z.string(),
  time: z.string(),
  doctorName: z.string(),
  recipientPhone: z.string(),
});

const notifyCancellationSchema = z.object({
  patientName: z.string(),
  specialty: z.string(),
  date: z.string(),
  time: z.string(),
  doctorName: z.string(),
  recipientPhone: z.string(),
  reason: z.string().optional(),
});

const sendPatientConfirmationSchema = z.object({
  patientName: z.string(),
  specialty: z.string(),
  date: z.string(),
  time: z.string(),
  doctorName: z.string(),
  recipientPhone: z.string(),
  appointmentId: z.string(),
});

/**
 * POST /api/whatsapp/notify-appointment
 * Send appointment notification to clinic owner
 */
router.post("/notify-appointment", async (req: Request, res: Response) => {
  try {
    const data = notifyAppointmentSchema.parse(req.body);
    const result = await sendAppointmentNotification(data);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Invalid request" : "Invalid request";
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/whatsapp/notify-cancellation
 * Send cancellation notification to clinic owner
 */
router.post("/notify-cancellation", async (req: Request, res: Response) => {
  try {
    const data = notifyCancellationSchema.parse(req.body);
    const result = await sendCancellationNotification(data);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Invalid request" : "Invalid request";
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/whatsapp/send-confirmation
 * Send confirmation message to patient
 */
router.post("/send-confirmation", async (req: Request, res: Response) => {
  try {
    const data = sendPatientConfirmationSchema.parse(req.body);
    const result = await sendPatientConfirmation(data);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message || "Invalid request" : "Invalid request";
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
