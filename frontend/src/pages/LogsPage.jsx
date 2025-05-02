import React, { useEffect, useState, useCallback } from 'react';
import { Layout, List, Typography, Card, Spin, Alert } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

const LogCard = React.memo(({ item, isError }) => (
  <Card
    size="small"
    style={{ marginBottom: 8 }}
    type={isError ? 'inner' : undefined}
  >
    <Text type="secondary">{item.timestamp}</Text>
    <br />
    <Text strong>{item.level.toUpperCase()}</Text>: {item.message}
  </Card>
));

export default function LogViewer() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/health`, { withCredentials: true });
      setLogs(response.data);
    } catch {
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLogs();
  }, [getLogs]);

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }} />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  const errorLogs = logs?.errorLogs?.filter(log => log.level === 'error');

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ padding: '16px', overflowY: 'auto' }}>
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>System Status</Title>
          <p><Text strong>Uptime:</Text> {logs.uptime}</p>
          <p><Text strong>Database:</Text> {logs.db}</p>
          <p><Text strong>Valkey:</Text> {logs.valkey}</p>
          <div style={{ marginTop: 8 }}>
            <Title level={5}>Memory Usage</Title>
            {Object.entries(logs.memory).map(([key, value]) => (
              <p key={key}><Text strong>{key}:</Text> {value}</p>
            ))}
            <p><Text strong>totalMemory:</Text> {logs.totalMemory}</p>
            <p><Text strong>freeMemory:</Text> {logs.freeMemory}</p>
            <p><Text strong>usedMemory:</Text> {logs.usedMemory}</p>
            <p><Text strong>processUptime:</Text> {logs.processUptime}</p>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Card title="Combined Logs" style={{ flex: 1, maxHeight: '70vh', overflowY: 'auto' }}>
            <List
              dataSource={logs?.combinedLog || []}
              renderItem={item => <LogCard item={item} isError={false} />}
            />
          </Card>

          <Card title="Error Logs" style={{ flex: 1, maxHeight: '70vh', overflowY: 'auto' }}>
            <List
              dataSource={errorLogs || []}
              renderItem={item => <LogCard item={item} isError={true} />}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
