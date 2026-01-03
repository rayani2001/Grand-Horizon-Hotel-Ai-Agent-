import { FunctionDeclaration, Schema, Type } from "@google/genai";

export const HOTEL_NAME = "Grand Horizon Hotel";

export const SYSTEM_INSTRUCTION = `
Role: You are a professional AI hotel concierge for Grand Horizon Hotel. You communicate with customers via voice or text and help them complete a hotel booking.

Main Objective: 
While talking to the customer, extract booking information step by step and update the booking summary on the screen in real time as soon as each detail is confirmed.

PRICING & ROOMS:
- Standard Room: $200 / night
- Deluxe Room: $350 / night
- Suite: $600 / night
- Tax: 12%

Conversation & Data Handling Rules:
1. Greet the guest politely and ask if they would like to make a booking.
2. Collect the following details one at a time: Guest name, Email, Check-in date, Check-out date, Number of guests, Room type.
3. **REAL-TIME UI UPDATE (CRITICAL):** As soon as the user provides a value, IMMEDIATELY call 'updateBookingDraft'. Do NOT wait until the end of the conversation.
   - Guest name -> update guestName
   - Email -> update email
   - Dates -> update checkIn / checkOut
   - Guests -> update guests
   - Room type -> update roomType
4. Automatically calculate subtotal, tax, and total based on the rates above and stay duration.
5. If a detail is unclear, politely ask for clarification.

Confirmation Flow:
1. Once all details are gathered, read back the full summary: Dates, Room type, Guests, Total price.
2. Ask: "Would you like me to confirm this booking?"
3. Only finalize by calling 'saveReservation' when the customer clearly says "yes" or "confirm".
4. After confirmation, call 'sendEmailConfirmation' to deliver the physical digital record.

Tone: Friendly, aristocratic, professional, and natural.
`;

const updateBookingDraftTool: FunctionDeclaration = {
  name: "updateBookingDraft",
  description: "Update the live on-screen receipt immediately as details emerge.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      email: { type: Type.STRING },
      checkIn: { type: Type.STRING, description: "YYYY-MM-DD" },
      checkOut: { type: Type.STRING, description: "YYYY-MM-DD" },
      roomType: { type: Type.STRING, enum: ["Standard Room", "Deluxe Room", "Suite"] },
      guests: { type: Type.NUMBER },
      specialRequests: { type: Type.STRING },
      subtotal: { type: Type.NUMBER },
      tax: { type: Type.NUMBER },
      total: { type: Type.NUMBER },
    },
  },
};

const sendEmailConfirmationTool: FunctionDeclaration = {
  name: "sendEmailConfirmation",
  description: "Deliver a physical-style digital letter to the guest mailbox.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      email: { type: Type.STRING },
      guestName: { type: Type.STRING },
      bookingDetails: { type: Type.STRING },
    },
    required: ["email", "guestName"],
  },
};

const saveReservationTool: FunctionDeclaration = {
  name: "saveReservation",
  description: "Commit the booking. Call this only after verbal/text confirmation from the guest.",
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

const attemptManagerCallTool: FunctionDeclaration = {
  name: "attemptManagerCall",
  description: "Bridge a call to the duty manager.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      guestName: { type: Type.STRING },
      reason: { type: Type.STRING },
    },
    required: ["guestName", "reason"],
  },
};

const createManagerMessageTool: FunctionDeclaration = {
  name: "createManagerMessage",
  description: "Send an urgent message to the manager.",
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

export const TOOLS = [
  updateBookingDraftTool, 
  sendEmailConfirmationTool, 
  saveReservationTool, 
  saveServiceRequestTool, 
  attemptManagerCallTool, 
  createManagerMessageTool
];

export const MODEL_CHAT = "gemini-3-flash-preview";
export const MODEL_VOICE = "gemini-2.5-flash-native-audio-preview-09-2025";