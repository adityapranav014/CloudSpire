import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

export default function Reports() {
  const { addToast } = useToast();
  const { can } = usePermissions();

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState(null); // 'completed', 'failed', null

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setDownloadUrl(null);
      setStatus(null);

      // Using generate-pdf/sync to get the file stream directly in the response
      const res = await api.post('/reports/generate-pdf/sync', {}, { responseType: 'blob' });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);

      // Try to parse filename from Content-Disposition header
      const contentDisposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'] || '';
      const parsedName = (() => {
        const match = /filename="?([^";]+)"?/.exec(contentDisposition);
        return match ? match[1] : `CloudSpire_Report.pdf`;
      })();

      setFileName(parsedName);
      setDownloadUrl(url);
      setStatus('completed');
      addToast('Report generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      setStatus('failed');
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate report';
      addToast(errorMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Reports" subtitle="Generate system health and performance reports" />

      <div className="mb-8 max-w-md">
        {/* Generate Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border p-6 shadow-depth-card flex flex-col h-full"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-depth-inset"
              style={{ background: `color-mix(in srgb, var(--accent-primary) 10%, var(--bg-base))` }}
            >
              <FileText size={24} style={{ color: 'var(--accent-primary)' }} strokeWidth={1.5} />
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>System Health PDF Report</h2>
          <p className="text-sm mb-6 flex-grow" style={{ color: 'var(--text-muted)' }}>
            Generate a comprehensive PDF report containing live metrics, system anomalies, and overall health status for executive review.
          </p>

          <div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
            className="w-full py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-depth-1 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              border: '1px solid transparent',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.15)'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileText size={16} /> Generate Report
              </>
            )}
            </button>
          </div>

          {status === 'completed' && downloadUrl && (
            <div className="mt-4 flex gap-2">
              <a
                href={downloadUrl}
                download={fileName || ''}
                className="py-2 px-3 rounded-lg bg-[--bg-elevated] border"
              >
                Download
              </a>
              <button
                onClick={() => window.open(downloadUrl, '_blank')}
                className="py-2 px-3 rounded-lg bg-[--bg-elevated] border"
              >
                View
              </button>
              <span className="ml-auto text-sm text-[--text-muted]">{fileName}</span>
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}
