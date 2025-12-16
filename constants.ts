import { FunctionDeclaration, Schema, Type } from "@google/genai";

export const HOTEL_NAME = "Grand Horizon Hotel";

export const SYSTEM_INSTRUCTION = `
You are an AI voice booking agent for a hotel reservation app (Grand Horizon Hotel).

PRICING & ROOMS (Per Night):
- Standard Room: $200
- Deluxe Room: $350
- Suite: $600

While speaking with the customer, you must:
1. Collect booking details (Name, Dates, Guests, Room Type).
2. Calculate the price based on the room type and number of nights.
3. Update the visual draft using 'updateBookingDraft'.
4. **CRITICAL:** You MUST ask for the customer's EMAIL ADDRESS before finalizing. You cannot book without an email.

Every confirmed detail must immediately appear on the customer’s screen.
When calculating price:
- Subtotal = Price Per Night * Number of Nights.
- Tax = 10% of Subtotal.
- Total = Subtotal + Tax.

Do not finalize the booking (using 'saveReservation') until:
1. The customer confirms the details.
2. You have collected their EMAIL address.

MANAGER ESCALATION PROTOCOL:
If a guest asks to speak to a manager:
1. First, politely ask for the reason/issue (if not already known).
2. Use 'attemptManagerCall'.
3. If 'busy', say: "The manager is currently unavailable. I am automatically forwarding your message to their priority inbox."
4. Immediately call 'createManagerMessage'.

TOOLS:
- updateBookingDraft: Call this IMMEDIATELY whenever you get a new piece of info (Name, Email, Room, Price, etc.).
- saveReservation: Call this ONLY after details are confirmed and EMAIL is collected.
- attemptManagerCall: Call this when the user wants to speak to a manager directly.
- createManagerMessage: Call this to log an issue/complaint.
- saveServiceRequest: Call this for other hotel services.
`;

const updateBookingDraftTool: FunctionDeclaration = {
  name: "updateBookingDraft",
  description: "Update the live on-screen booking summary. Call this frequently.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      email: { type: Type.STRING },
      checkIn: { type: Type.STRING },
      checkOut: { type: Type.STRING },
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
  description: "Finalize and save a confirmed room reservation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      email: { type: Type.STRING, description: "Required for confirmation email" },
      checkIn: { type: Type.STRING, description: "YYYY-MM-DD" },
      checkOut: { type: Type.STRING, description: "YYYY-MM-DD" },
      guests: { type: Type.NUMBER },
      roomType: { type: Type.STRING },
      specialRequests: { type: Type.STRING },
    },
    required: ["guestName", "email", "checkIn", "checkOut", "guests", "roomType"],
  },
};

const attemptManagerCallTool: FunctionDeclaration = {
  name: "attemptManagerCall",
  description: "Attempt to connect the guest directly to a manager via phone.",
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
  description: "Log a service request like room service, cleaning, or maintenance.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      requestType: { type: Type.STRING, description: "Room Service, Cleaning, Towels, etc." },
      details: { type: Type.STRING, description: "Full description of items or service needed" },
      roomNumber: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ["guestName", "requestType", "details"],
  },
};

const createManagerMessageTool: FunctionDeclaration = {
  name: "createManagerMessage",
  description: "Escalate an issue to the manager. Triggers an automatic message to the manager.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      contactDetails: { type: Type.STRING, description: "Guest Phone Number or Room Number for call back" },
      issue: { type: Type.STRING, description: "Detailed complaint or reason for call" },
      urgency: { type: Type.STRING, enum: ["low", "medium", "high"] },
    },
    required: ["guestName", "issue", "urgency"],
  },
};

export const TOOLS = [updateBookingDraftTool, saveReservationTool, saveServiceRequestTool, attemptManagerCallTool, createManagerMessageTool];

// Models
export const MODEL_CHAT = "gemini-2.5-flash";
export const MODEL_VOICE = "gemini-2.5-flash-native-audio-preview-09-2025";