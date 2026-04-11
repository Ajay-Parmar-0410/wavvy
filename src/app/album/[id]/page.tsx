import { Disc3 } from "lucide-react";

export default function AlbumPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
          <Disc3 className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
          Album
        </h2>
        <p className="text-text-secondary text-sm">
          Album details will load here. ID: {params.id}
        </p>
      </div>
    </div>
  );
}
