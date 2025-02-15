import express from "express";
import creditNoteController from "../controllers/creditnote.js";

const router = express.Router();

router.post("/api/createCreditnote", creditNoteController.createCreditNote);
router.patch("/api/:creditNoteId/settle", creditNoteController.updateCreditNoteStatus);
router.get("/api/creditnote/:orgId", creditNoteController.getAllCreditNotesForOrganization);

export default router;