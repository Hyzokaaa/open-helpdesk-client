import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet, { SheetCloseButton } from "@modules/app/modules/ui/components/Sheet/Sheet";

interface VersionItem {
  id: string;
  content: string;
  editorName: string;
  createdAt: string;
}

interface Props {
  title: string;
  items: VersionItem[] | null;
  onClose: () => void;
}

export default function VersionHistoryModal({ title, items, onClose }: Props) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();

  return (
    <Sheet size="md" hideClose onClose={onClose}>
      <div className="sticky top-0 z-10 -mx-6 -mt-4 px-6 pt-4 pb-3 mb-4 bg-surface flex items-center gap-3">
        <h3 className="text-base font-body-bold text-heading min-w-0 flex-1 truncate">{title}</h3>
        <SheetCloseButton onClick={onClose} />
      </div>

      {items === null ? (
        <div className="flex justify-center py-8"><Spinner width={20} /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">{t("editHistory.noEdits")}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border border-border-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-body-medium text-heading">{item.editorName}</span>
                <span className="text-exs text-muted">{formatDate(item.createdAt)}</span>
              </div>
              <div
                className="text-sm text-muted tiptap"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
