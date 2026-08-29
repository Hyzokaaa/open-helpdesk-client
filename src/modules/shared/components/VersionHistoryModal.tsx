import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card">
          <h3 className="text-base font-body-bold text-heading">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-body cursor-pointer text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
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
        </div>
      </div>
    </div>
  );
}
