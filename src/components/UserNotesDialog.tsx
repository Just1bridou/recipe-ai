"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";

interface Props {
  open: boolean;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

export function UserNotesDialog({ open, onConfirm, onCancel }: Props) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
  };

  const handleCancel = () => {
    setNotes("");
    onCancel();
  };

  return (
    <BottomSheet open={open} onClose={handleCancel} title="Détails supplémentaires">
      <p className="sheet-hint">
        Ajoute des détails optionnels pour personnaliser la génération (préférences, restrictions, thèmes…).
      </p>
      <textarea
        className="notes-input"
        placeholder="Ex: Sans gluten, avec beaucoup d'épices, cuisine asiatique…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCancel}
          style={{ flex: 1, marginTop: 0 }}
        >
          Annuler
        </button>
        <button
          type="button"
          className="btn-cta"
          onClick={handleConfirm}
          style={{ flex: 1, marginTop: 0 }}
        >
          Générer
        </button>
      </div>
    </BottomSheet>
  );
}
