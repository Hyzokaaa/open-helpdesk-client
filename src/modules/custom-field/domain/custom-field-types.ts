export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "multi-select" | "date" | "checkbox";
  options: string[] | null;
  position: number;
  required: boolean;
}
