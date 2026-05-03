import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { UserListItem, listUsers, addMember } from "../services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const ROLES = ["admin", "agent", "reporter"] as const;

interface Row {
  userId: string | null;
  role: string;
}

interface Props {
  workspaceSlug: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddMemberSheet({ workspaceSlug, existingMemberIds, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [rows, setRows] = useState<Row[]>([{ userId: null, role: "reporter" }]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    listUsers().then(setUsers);
  }, []);

  const selectedUserIds = rows.map((r) => r.userId).filter(Boolean) as string[];
  const availableUsers = (rowIndex: number) =>
    users.filter((u) =>
      !existingMemberIds.includes(u.id) &&
      (!selectedUserIds.includes(u.id) || rows[rowIndex].userId === u.id),
    );

  const updateRow = (index: number, field: keyof Row, value: string | null) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { userId: null, role: "reporter" }]);
  };

  const validRows = rows.filter((r) => r.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) return;
    setAdding(true);
    let added = 0;
    for (const row of validRows) {
      try {
        await addMember(workspaceSlug, { userId: row.userId!, role: row.role });
        added++;
      } catch (err: any) {
        if (!err?.handled) {
          const user = users.find((u) => u.id === row.userId);
          toast.error(`${t("members.addError")}: ${user?.email ?? row.userId}`);
        }
      }
    }
    if (added > 0) {
      toast.success(`${added} ${t("members.added")}`);
      onAdded?.();
      onClose();
    }
    setAdding(false);
  };

  return (
    <Sheet onClose={onClose}>
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-3">{t("members.add")}</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-3 items-end">
                <FormInput label={i === 0 ? t("members.user") : undefined} required className="flex-[3] !mb-0">
                  <Select
                    options={availableUsers(i)}
                    label={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
                    value={(u) => u.id === row.userId}
                    onChange={(u) => updateRow(i, "userId", u.id)}
                    placeholder={t("members.selectUser")}
                  />
                </FormInput>
                <FormInput label={i === 0 ? t("members.role") : undefined} required className="flex-1 !mb-0">
                  <Select
                    options={[...ROLES]}
                    label={(r) => r}
                    value={(r) => r === row.role}
                    onChange={(r) => updateRow(i, "role", r)}
                  />
                </FormInput>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full mt-3 py-2 border-2 border-dashed border-border-input rounded-lg text-xs font-body-medium text-muted hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
          >
            + {t("members.addAnother")}
          </button>

          <div className="flex justify-end gap-2 mt-6">
            <Button size="sm" color="light" onClick={onClose}>
              {t("members.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={adding} disabled={validRows.length === 0}>
              {t("members.add")}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
