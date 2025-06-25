import React from "react";
import SimpleMemorialEditorFixed from "./SimpleMemorialEditorFixed";

interface SimpleMemorialEditorProps {
  memorial: any;
  onSave: (updates: any) => void;
}

export default function SimpleMemorialEditor({ memorial, onSave }: SimpleMemorialEditorProps) {
  return <SimpleMemorialEditorFixed memorial={memorial} onSave={onSave} />;
}