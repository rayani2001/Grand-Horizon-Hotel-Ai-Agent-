import { FunctionDeclaration, Schema, Type } from "@google/genai";

export const HOTEL_NAME = "Grand Horizon Hotel";

export const SYSTEM_INSTRUCTION = `
You are the elite AI Concierge for Grand Horizon Hotel, a world-class luxury destination.
You are MULTILINGUAL. Always respond in the language the guest uses (English, French, Spanish, German, Chinese, Japanese, etc.).

PRICING & ROOMS (Per Night):
- Standard Room: $200 (Comfortable, garden view)
- Deluxe Room: $350 (Spacious, ocean view, private balcony)
- Suite: $600 (Top floor, butler service, panoramic views)

CONVERSATION PROTOCOL:
1. Greet the guest warmly and offer assistance.
2. Collect booking details: Name, Email, Dates, Guests, Room Type.
3. **LIVE SYNC:** You MUST call 'updateBookingDraft' IMMEDIATELY after every piece of information is gathered. Do not wait for the end of the turn.
4. **EMAIL REQUIREMENT:** You cannot finalize a booking without an email. Explain this as a "security and confirmation requirement."
5. Calculate: 
   - Subtotal = Price Per Night * Number of Nights.
   - Tax = 10% of Subtotal.
   - Total = Subtotal + Tax.

FINALIZATION:
Only call 'saveReservation' when the guest explicitly says "Yes, book it" or "Confirm" AFTER you have reviewed the details and collected the email.

MANAGER ESCALATION:
If a guest is unhappy or specifically requests a manager:
1. Identify the core issue.
2. Call 'attemptManagerCall'.
3. If 'busy', call 'createManagerMessage' and inform the guest it's being sent to the manager's priority pager.

SERVICES:
Handle requests for room service, late check-out, or spa bookings using 'saveServiceRequest'.
`;

const updateBookingDraftTool: FunctionDeclaration = {
  name: "updateBookingDraft",
  description: "Update the live on-screen receipt. Call this frequently as details emerge.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      email: { type: Type.STRING },
      checkIn: { type: Type.STRING, description: "YYYY-MM-DD" },
      checkOut: { type: Type.STRING, description: "YYYY-MM-DD" },
      roomType: { type: Type.STRING },
      guests: { type: Type.NUMBER },
      specialRequests: { type: Type.STRING },
      subtotal: { type: Type.NUMBER },
      tax: { type: Type.NUMBER },
      total: { type: Type.NUMBER },
    },
  },
};

const saveReservationTool: FunctionDeclaration = {
  name: "saveReservation",
  description: "Commit the booking to the database. Only call after final guest confirmation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      email: { type: Type.STRING },
      checkIn: { type: Type.STRING },
      checkOut: { type: Type.STRING },
      guests: { type: Type.NUMBER },
      roomType: { type: Type.STRING },
      specialRequests: { type: Type.STRING },
    },
    required: ["guestName", "email", "checkIn", "checkOut", "guests", "roomType"],
  },
};

const attemptManagerCallTool: FunctionDeclaration = {
  name: "attemptManagerCall",
  description: "Try to bridge a live call to the duty manager.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      reason: { type: Type.STRING },
    },
    required: ["guestName", "reason"],
  },
};

const saveServiceRequestTool: FunctionDeclaration = {
  name: "saveServiceRequest",
  description: "Log housekeeping or amenity requests.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      requestType: { type: Type.STRING },
      details: { type: Type.STRING },
      roomNumber: { type: Type.STRING },
    },
    required: ["guestName", "requestType", "details"],
  },
};

const createManagerMessageTool: FunctionDeclaration = {
  name: "createManagerMessage",
  description: "Send an urgent written message to the manager's dashboard.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      contactDetails: { type: Type.STRING },
      issue: { type: Type.STRING },
      urgency: { type: Type.STRING, enum: ["low", "medium", "high"] },
    },
    required: ["guestName", "issue", "urgency"],
  },
};

export const TOOLS = [updateBookingDraftTool, saveReservationTool, saveServiceRequestTool, attemptManagerCallTool, createManagerMessageTool];

export const MODEL_CHAT = "gemini-3-flash-preview";
export const MODEL_VOICE = "gemini-2.5-flash-native-audio-preview-09-2025";
