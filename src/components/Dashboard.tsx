import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const campaignOptions = ['Winter Promo'];
const pieData = [
  { name: 'Dialed', value: 6000, color: '#2E7D32' },
  { name: 'In Progress', value: 500, color: '#1976D2' },
  { name: 'Remaining', value: 3500, color: '#90A4AE' },
];
const totalCalls = pieData.reduce((sum, d) => sum + d.value, 0);
const metrics = {
  etc: '2h 15m',
  att: '4m 30s',
  avgHandleTime: '4m 30s',
  completionRate: '60%',
};
const wrapUpCodes = [
  { code: 'Sale', count: 1200 },
  { code: 'No Answer', count: 800 },
  { code: 'Voicemail', count: 500 },
  { code: 'DNC', count: 300 },
];

export default function IvrCampaignDashboard() {
  const [campaign, setCampaign] = React.useState(campaignOptions[0]);
  const [enabled, setEnabled] = React.useState(true);

  const handleCampaignChange = (e: SelectChangeEvent) => {
    setCampaign(e.target.value as string);
  };

  return (
    <Card sx={{ maxWidth: 1000, margin: 'auto', mt: 4, p: 2 }}>
      <CardContent>
        {/* Header Controls */}
        <Grid container alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <FormControl variant="outlined" size="small">
              <InputLabel>Campaign</InputLabel>
              <Select
                label="Campaign"
                value={campaign}
                onChange={handleCampaignChange}
              >
                {campaignOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <Typography variant="h6" component="div">
              00:45:12
            </Typography>
          </Grid>
          <Grid item>
            <Typography color="textSecondary">
              Last modified
            </Typography>
          </Grid>
          <Grid item>
            <Switch
              checked={enabled}
              onChange={() => setEnabled(e => !e)}
            />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Donut Chart */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="subtitle1" color="textSecondary">
                  Total
                </Typography>
                <Typography variant="h5">
                  {totalCalls.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ mt: 2 }}>
              {pieData.map(d => (
                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: d.color,
                      borderRadius: '50%',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {d.name}
                  </Typography>
                  <Typography variant="body2">
                    {d.value.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Metrics & Wrap-Up Codes */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {[
                { label: 'ETC', value: metrics.etc },
                { label: 'ATT', value: metrics.att },
                { label: 'Average H\'time', value: metrics.avgHandleTime },
                { label: 'Rate of Completion', value: metrics.completionRate },
              ].map((m, i) => (
                <Grid item xs={6} key={i}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {m.label}
                    </Typography>
                    <Typography variant="h6">
                      {m.value}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Wrap-Up Codes
              </Typography>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wrapUpCodes.map((r) => (
                      <TableRow key={r.code}>
                        <TableCell>{r.code}</TableCell>
                        <TableCell align="right">
                          {r.count.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
