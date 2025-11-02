import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Storage as DatabaseIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface SearchPerformanceMonitorProps {
  useElastic?: boolean;
  es_took?: number;
  es_timed_out?: boolean;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
  resultCount?: number;
  total?: number;
}

const SearchPerformanceMonitor: React.FC<SearchPerformanceMonitorProps> = ({
  useElastic,
  es_took,
  es_timed_out,
  fallbackUsed,
  cacheHit,
  resultCount,
  total
}) => {
  if (!useElastic && !es_took && !fallbackUsed && !cacheHit) {
    return null; // Don't render if no performance data
  }

  const getPerformanceColor = () => {
    if (es_timed_out) return 'error';
    if (es_took && es_took > 1000) return 'warning';
    if (es_took && es_took < 100) return 'success';
    return 'info';
  };

  const getPerformanceLabel = () => {
    if (es_timed_out) return 'Timed Out';
    if (es_took && es_took > 1000) return 'Slow';
    if (es_took && es_took < 100) return 'Fast';
    return 'Normal';
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Search Performance:
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* Search Engine Indicator */}
          {useElastic !== undefined && (
            <Chip
              icon={useElastic ? <SpeedIcon /> : <DatabaseIcon />}
              label={useElastic ? 'Elasticsearch' : 'Database'}
              color={useElastic ? 'primary' : 'info'}
              size="small"
            />
          )}

          {/* Performance Metrics */}
          {es_took !== undefined && (
            <Tooltip title={`${getPerformanceLabel()} performance`}>
              <Chip
                icon={<SpeedIcon />}
                label={`${es_took}ms`}
                color={getPerformanceColor()}
                size="small"
              />
            </Tooltip>
          )}

          {/* Timeout Warning */}
          {es_timed_out && (
            <Tooltip title="Search timed out, results may be incomplete">
              <Chip
                icon={<WarningIcon />}
                label="Timeout"
                color="error"
                size="small"
              />
            </Tooltip>
          )}

          {/* Fallback Indicator */}
          {fallbackUsed && (
            <Tooltip title="Elasticsearch failed, using database fallback">
              <Chip
                icon={<DatabaseIcon />}
                label="DB Fallback"
                color="warning"
                size="small"
              />
            </Tooltip>
          )}

          {/* Cache Hit Indicator */}
          {cacheHit && (
            <Tooltip title="Results served from cache">
              <Chip
                icon={<InfoIcon />}
                label="Cached"
                color="success"
                size="small"
              />
            </Tooltip>
          )}

          {/* Results Count */}
          {resultCount !== undefined && total !== undefined && (
            <Tooltip title={`Showing ${resultCount} of ${total} results`}>
              <Chip
                label={`${resultCount}/${total}`}
                color="default"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SearchPerformanceMonitor; 