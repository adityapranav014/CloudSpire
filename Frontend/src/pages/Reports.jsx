import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

export default function Reports() {
  const { addToast } = useToast();
  const { can } = usePermissions();

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [status, setStatus] = useState(null); // 'completed', 'failed', null

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setDownloadUrl(null);
      setStatus(null);

      // Using generate-pdf/sync to get the file stream directly in the response
      const res = await api.post('/reports/generate-pdf/sync', {}, {
        responseType: 'blob'
      });

      // Read the PDF stream as a Blob
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      
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

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Reports" subtitle="Generate system health and performance reports" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border p-6 shadow-depth-card flex flex-col h-full"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Report Status</h2>
          
          <div className="flex-grow flex flex-col justify-center">
            {!isGenerating && !downloadUrl && status !== 'failed' && (
              <div className="text-center p-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click 'Generate Report' to create a new PDF.</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center p-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-subtle)' }}>
                <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generating your report...</p>
              </div>
            )}

            {!isGenerating && status === 'failed' && (
              <div className="text-center p-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--accent-red)' }}>
                <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--accent-red)' }} />
                <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Report generation failed.</p>
              </div>
            )}

            {!isGenerating && downloadUrl && (
              <div className="text-center p-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: 'var(--accent-emerald)' }} />
                <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Your report is ready!</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border shadow-depth-1 transition-colors hover:bg-[--bg-hover]"
                    style={{ 
                      background: 'var(--bg-surface)', 
                      borderColor: 'var(--border-default)', 
                      color: 'var(--text-secondary)' 
                    }}
                  >
                    <FileText size={16} /> View PDF
                  </button>
                  
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = downloadUrl;
                      a.download = "system-health-report.pdf";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 border shadow-depth-1 transition-colors hover:bg-[--bg-hover]"
                    style={{ 
                      background: 'var(--bg-elevated)', 
                      borderColor: 'var(--border-strong)', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
