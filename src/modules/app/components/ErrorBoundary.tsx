import { Component, type ReactNode } from "react";
// This boundary wraps the providers, so it cannot use the useTranslation hook;
// the standalone t() reads the stored language from localStorage instead.
import { t } from "@modules/app/i18n/translations";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-body-bold text-heading mb-2">
            {t("errorBoundary.title")}
          </h1>
          <p className="text-sm text-muted mb-6">
            {t("errorBoundary.message")}
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 text-sm font-body-semibold rounded-button bg-primary-600 text-on-primary hover:bg-primary-700 transition-colors cursor-pointer"
          >
            {t("errorBoundary.reload")}
          </button>
        </div>
      </div>
    );
  }
}
