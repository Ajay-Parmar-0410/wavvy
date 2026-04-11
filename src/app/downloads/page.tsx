import { Download } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
        Downloads
      </h1>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
          <Download className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
          No downloads yet
        </h2>
        <p className="text-text-secondary text-sm max-w-sm">
          Download songs for offline listening.
        </p>
      </div>
    </div>
  );
}
