import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Cpu, HardDrive, Network, Clock, Server, Activity, ArrowUp, ArrowDown } from 'lucide-react'
import MetricCard from '../components/ui/MetricCard'
// removed useMigrationData

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatUptime(seconds) {
  if (!seconds) return '0 mins';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Metrics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('cloudspire_token');
      const response = await fetch('http://localhost:4000/api/v1/metrics', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      // Assume backend returns { success: true, data: { ... } } or directly the data
      setData(json.data || json);
      setIsError(false);
      setErrorMessage('');
    } catch (err) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to fetch metrics');
    } finally {
      setIsLoading(false); // Only true on initial load
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 5000);
    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  const mutate = fetchMetrics;

  const metricsData = useMemo(() => {
    if (!data) return null;

    // CPU
    const cpuUsage = data.cpu || 0;
    
    // Memory
    const memUsed = data.memory?.used || 0;
    const memTotal = data.memory?.total || 0;
    const memPercent = data.memory?.percent || 0;

    // Disk
    const diskTotal = data.disk?.reduce((acc, d) => acc + (d.size || 0), 0) || 0;
    const diskUsed = data.disk?.reduce((acc, d) => acc + (d.used || 0), 0) || 0;
    const diskPercent = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(1) : 0;

    // Network
    const netRx = data.network?.rx || 0;
    const netTx = data.network?.tx || 0;

    // Load
    const avgLoad = data.load?.avgLoad || 0;
    
    // Uptime
    const uptime = data.uptime || 0;

    return {
      cpuUsage,
      memUsed,
      memTotal,
      memPercent,
      diskTotal,
      diskUsed,
      diskPercent,
      netRx,
      netTx,
      avgLoad,
      uptime
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--accent-primary)] rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !metricsData) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center layer-raised p-8 rounded-2xl border border-[var(--border-subtle)]">
          <p className="text-rose-400 font-semibold mb-1">Failed to load metrics</p>
          <p className="text-sm text-zinc-500 mb-4">{errorMessage || 'Ensure the backend server is running.'}</p>
          <button 
            onClick={() => mutate()} 
            className="px-4 py-2 text-xs font-semibold rounded-lg shiny-primary transition-opacity hover:opacity-90 text-white"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto pb-12"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          System Metrics
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Real-time hardware telemetry and performance monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="CPU Usage"
          value={`${metricsData.cpuUsage}%`}
          subtitle="Total load across all cores"
          trend={metricsData.cpuUsage > 80 ? 'warning' : 'neutral'}
          trendValue={metricsData.cpuUsage > 80 ? 'High Load' : 'Normal'}
          progress={metricsData.cpuUsage}
          icon={Cpu}
          accentColor={metricsData.cpuUsage > 80 ? 'var(--accent-rose)' : '#3b82f6'}
          upIsGood={false}
        />

        <MetricCard
          title="Memory Usage"
          value={`${metricsData.memPercent}%`}
          subtitle={`${formatBytes(metricsData.memUsed)} / ${formatBytes(metricsData.memTotal)}`}
          trend={metricsData.memPercent > 80 ? 'warning' : 'neutral'}
          trendValue={metricsData.memPercent > 80 ? 'Critical' : 'Healthy'}
          progress={metricsData.memPercent}
          icon={Server}
          accentColor={metricsData.memPercent > 80 ? 'var(--accent-rose)' : '#8b5cf6'}
          upIsGood={false}
        />

        <MetricCard
          title="Disk Capacity"
          value={`${metricsData.diskPercent}%`}
          subtitle={`${formatBytes(metricsData.diskUsed)} / ${formatBytes(metricsData.diskTotal)}`}
          trend={metricsData.diskPercent > 80 ? 'warning' : 'neutral'}
          trendValue={metricsData.diskPercent > 80 ? 'Low Space' : 'Healthy'}
          progress={metricsData.diskPercent}
          icon={HardDrive}
          accentColor={metricsData.diskPercent > 80 ? 'var(--accent-rose)' : '#10b981'}
          upIsGood={false}
        />

        <MetricCard
          title="Network Traffic"
          value={formatBytes(metricsData.netRx + metricsData.netTx)}
          subtitle={`RX: ${formatBytes(metricsData.netRx)} \u2022 TX: ${formatBytes(metricsData.netTx)}`}
          trend="up"
          trendValue="Active"
          icon={Network}
          accentColor="#06b6d4"
          upIsGood={false}
        />

        <MetricCard
          title="Load Average"
          value={typeof metricsData.avgLoad === 'number' ? metricsData.avgLoad.toFixed(2) : '0.00'}
          subtitle="1 min average"
          trend="neutral"
          trendValue="Stable"
          icon={Activity}
          accentColor="#f59e0b"
          upIsGood={false}
        />

        <MetricCard
          title="System Uptime"
          value={formatUptime(metricsData.uptime)}
          subtitle="Time since last boot"
          trend="up"
          trendValue="Online"
          icon={Clock}
          accentColor="#ec4899"
          upIsGood={true}
        />
      </div>
      
      <div className="mt-8 rounded-2xl p-6 border layer-raised flex items-start gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
         <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-primary-subtle)' }}>
            <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
         </div>
         <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Metrics Polling Active</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Hardware data is retrieved directly from the host system using <code>systeminformation</code>. 
              The backend employs a fast, TTL-based caching layer to prevent excessive CPU polling. Values refresh automatically when interacting with the API.
            </p>
         </div>
      </div>
    </motion.div>
  )
}
