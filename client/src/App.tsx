import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Typography,
  Input,
  Space,
  Button,
  Table,
  Tag,
  Switch,
  message,
  Segmented,
  Progress,
  Tooltip,
  Card,
  Row,
  Col,
} from 'antd';
import type { ColumnsType, TablePaginationConfig, TableProps } from 'antd/es/table';
import {
  fetchMonitoredUsers,
  updateMonitoring,
  batchUpdateMonitoring,
  updateUserDetails,
  scanFollowings,
  triggerTweetScan,
  fetchMonitoringConfig,
} from './services/api';
import { MonitoredUser, MonitoringConfig } from './types/index';
import ImportUsersModal from './components/ImportUsersModal';
import UserDetailDrawer from './components/UserDetailDrawer';

const { Header, Content } = Layout;

const handleToDisplay = (handle: string) => (handle.startsWith('@') ? handle : `@${handle}`);

const App = () => {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 10 });
  const [sortState, setSortState] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>(
    { sortBy: 'quality_rating.score', sortOrder: 'desc' }
  );
  const [importVisible, setImportVisible] = useState(false);
  const [activeUser, setActiveUser] = useState<MonitoredUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scanHandle, setScanHandle] = useState('InfoEchoes');
  const [config, setConfig] = useState<MonitoringConfig | null>(null);
  const [actionsLoading, setActionsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await fetchMonitoringConfig();
      setConfig(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: pagination.pageSize,
        offset: ((pagination.current || 1) - 1) * (pagination.pageSize || 10),
        sortBy: sortState.sortBy,
        sortOrder: sortState.sortOrder,
      };
      const response = await fetchMonitoredUsers(params);
      setUsers(response.items);
      setTotal(response.total);
      setSelectedRowKeys((prev) => prev.filter((key) => response.items.some((item) => item._id === key)));
    } catch (error) {
      console.error(error);
      message.error('Failed to load monitored users');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.current, pagination.pageSize, sortState.sortBy, sortState.sortOrder]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange: TableProps<MonitoredUser>['onChange'] = (
    newPagination,
    _filters,
    sorter
  ) => {
    setPagination(newPagination);
    if (!Array.isArray(sorter) && sorter.order) {
      const map: Record<string, string> = {
        quality_score: 'quality_rating.score',
        followers: 'profile.followers_count',
        last_scan: 'stats.last_scan_time',
      };
      const fieldKey = (sorter.columnKey as string) || 'quality_score';
      const sortBy = map[fieldKey] || 'quality_rating.score';
      const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortState({ sortBy, sortOrder });
    }
  };

  const toggleMonitoring = async (user: MonitoredUser, isActive: boolean) => {
    try {
      const updated = await updateMonitoring(user._id, { is_active: isActive });
      setUsers((prev) => prev.map((item) => (item._id === updated._id ? { ...item, monitoring: updated.monitoring } : item)));
      message.success(`User ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error(error);
      message.error('Failed to update monitoring');
    }
  };

  const handleBatchToggle = async (isActive: boolean) => {
    if (!selectedRowKeys.length) {
      message.info('Select at least one user');
      return;
    }
    try {
      await batchUpdateMonitoring({ userIds: selectedRowKeys as string[], is_active: isActive });
      message.success(`Updated ${selectedRowKeys.length} users`);
      await loadUsers();
    } catch (error) {
      console.error(error);
      message.error('Batch update failed');
    }
  };

  const openDrawer = (user: MonitoredUser) => {
    setActiveUser(user);
    setDrawerOpen(true);
  };

  const handleDrawerSave = async (values: { tags: string[]; notes?: string }) => {
    if (!activeUser) return;
    try {
      const updated = await updateUserDetails(activeUser._id, values);
      setUsers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setActiveUser(updated);
      message.success('User updated');
    } catch (error) {
      console.error(error);
      message.error('Failed to update user');
    }
  };

  const handleScanFollowings = async () => {
    if (!scanHandle) {
      message.warning('Enter a Twitter handle to scan');
      return;
    }
    try {
      setActionsLoading(true);
      await scanFollowings(scanHandle);
      message.success('Followings scanned');
      await loadUsers();
    } catch (error) {
      console.error(error);
      message.error('Failed to scan followings');
    } finally {
      setActionsLoading(false);
    }
  };

  const handleScanTweets = async (handle?: string) => {
    try {
      setActionsLoading(true);
      await triggerTweetScan(handle);
      message.success(handle ? `Scan triggered for ${handleToDisplay(handle)}` : 'Scan triggered for active users');
      await loadUsers();
    } catch (error) {
      console.error(error);
      message.error('Failed to trigger scan');
    } finally {
      setActionsLoading(false);
    }
  };

  const columns: ColumnsType<MonitoredUser> = useMemo(() => [
    {
      title: 'User',
      dataIndex: 'twitter_handle',
      key: 'user',
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{handleToDisplay(record.twitter_handle)}</Typography.Text>
          <Typography.Text type="secondary">{record.display_name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Quality',
      key: 'quality_score',
      sorter: true,
      sortOrder: sortState.sortBy === 'quality_rating.score' ? (sortState.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (_value, record) => (
        <div>
          <Progress percent={Math.round(record.quality_rating.score)} size="small" status={record.quality_rating.score >= 70 ? 'success' : record.quality_rating.score >= 40 ? 'normal' : 'exception'} />
          <Typography.Text type="secondary">
            Acc: {record.quality_rating.accuracy} · Inf: {record.quality_rating.influence} · Time: {record.quality_rating.timeliness}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Followers',
      dataIndex: ['profile', 'followers_count'],
      key: 'followers',
      sorter: true,
      sortOrder: sortState.sortBy === 'profile.followers_count' ? (sortState.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (value) => value?.toLocaleString() ?? '-',
    },
    {
      title: 'Topics',
      key: 'topics',
      render: (_value, record) => (
        <Space size={[4, 4]} wrap>
          {record.main_topics.length ? (
            record.main_topics.map((topic) => (
              <Tag key={topic} color="geekblue">
                {topic}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">None</Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Recent Mentions',
      key: 'mentions',
      render: (_value, record) => (
        <Space size={[4, 4]} wrap>
          {record.recent_mentions.length ? (
            record.recent_mentions.slice(0, 3).map((mention) => (
              <Tag key={mention.symbol} color="blue">
                {mention.symbol} · {mention.mention_count}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">None</Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Last Scan',
      dataIndex: ['stats', 'last_scan_time'],
      key: 'last_scan',
      sorter: true,
      sortOrder: sortState.sortBy === 'stats.last_scan_time' ? (sortState.sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (value) => (value ? new Date(value).toLocaleString() : 'N/A'),
    },
    {
      title: 'Monitoring',
      key: 'monitoring',
      render: (_value, record) => (
        <Switch
          checked={record.monitoring.is_active}
          onChange={(checked) => toggleMonitoring(record, checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_value, record) => (
        <Space>
          <Button type="link" onClick={() => openDrawer(record)}>
            Details
          </Button>
          <Tooltip title="Trigger tweet scan">
            <Button size="small" onClick={() => handleScanTweets(record.twitter_handle)}>
              Scan
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ], [sortState.sortBy, sortState.sortOrder]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Space align="center" size="large">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Twitter User Monitoring
          </Typography.Title>
          <Tag color="gold">Crypto Intelligence</Tag>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={12} sm={12} md={8} xl={6}>
              <Card bordered={false}>
                <Typography.Text type="secondary">Monitored Users</Typography.Text>
                <Typography.Title level={3}>{total}</Typography.Title>
              </Card>
            </Col>
            {config && (
              <Col span={12} sm={12} md={8} xl={6}>
                <Card bordered={false}>
                  <Typography.Text type="secondary">Scan Interval</Typography.Text>
                  <Typography.Title level={3}>{config.scan_settings.scan_interval} min</Typography.Title>
                </Card>
              </Col>
            )}
          </Row>

          <Space size="middle" wrap>
            <Input.Search
              placeholder="Search by handle, display name or tags"
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Segmented
              value={statusFilter}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              onChange={(value) => handleStatusChange(value as 'all' | 'active' | 'inactive')}
            />
            <Space>
              <Input
                value={scanHandle}
                onChange={(event) => setScanHandle(event.target.value)}
                placeholder="Handle for following scan"
                prefix="@"
                style={{ width: 220 }}
              />
              <Button type="primary" loading={actionsLoading} onClick={handleScanFollowings}>
                Scan Followings
              </Button>
            </Space>
            <Button onClick={() => handleScanTweets()} loading={actionsLoading}>
              Scan Active Users
            </Button>
            <Button type="dashed" onClick={() => setImportVisible(true)}>
              Import Users
            </Button>
            <Button onClick={() => handleBatchToggle(true)} disabled={!selectedRowKeys.length}>
              Activate Selected
            </Button>
            <Button onClick={() => handleBatchToggle(false)} disabled={!selectedRowKeys.length}>
              Deactivate Selected
            </Button>
          </Space>

          <Table<MonitoredUser>
            rowKey="_id"
            loading={loading}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            columns={columns}
            dataSource={users}
            pagination={{
              ...pagination,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
            onChange={handleTableChange}
          />
        </Space>
      </Content>

      <ImportUsersModal
        open={importVisible}
        onClose={() => setImportVisible(false)}
        onSuccess={loadUsers}
      />

      <UserDetailDrawer
        user={activeUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
      />
    </Layout>
  );
};

export default App;
