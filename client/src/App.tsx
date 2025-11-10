import { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Typography,
  Input,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Progress,
  Space,
  Divider,
  Statistic,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

type LeaderboardEntry = {
  handle: string;
  displayName: string;
  tagline: string;
  totalScore: number;
  qualityScore: number;
  volumeScore: number;
  grade: 'S' | 'A+' | 'A' | 'B+' | 'B';
  followers: number;
  trend: 'rising' | 'steady' | 'cooling';
  topics: string[];
  lastNotableTweet: string;
};

const leaderboardData: LeaderboardEntry[] = [
  {
    handle: '@InfoEchoes',
    displayName: 'Info Echoes',
    tagline: '链上数据猎手，擅长把复杂模型翻译成一句话金句。',
    totalScore: 92.4,
    qualityScore: 89,
    volumeScore: 78,
    grade: 'S',
    followers: 43800,
    trend: 'rising',
    topics: ['Layer2', 'On-chain Data', '市场情绪'],
    lastNotableTweet: '对比 OP Stack 与 Polygon CDK 的模块化策略，引发 1.8 万次讨论。',
  },
  {
    handle: '@WuBlockchain',
    displayName: '吴说区块链',
    tagline: '中文圈最稳定的新闻黑匣子，爆料速度拉满。',
    totalScore: 90.1,
    qualityScore: 87,
    volumeScore: 74,
    grade: 'S',
    followers: 254000,
    trend: 'steady',
    topics: ['产业', '项目进展', '交易所'],
    lastNotableTweet: '提前两小时披露某头部交易所的上币计划，点赞破万。',
  },
  {
    handle: '@ChainTeaParty',
    displayName: '链茶会',
    tagline: '用 Meme 打开研究报告，内容质量稳得很。',
    totalScore: 87.6,
    qualityScore: 84,
    volumeScore: 70,
    grade: 'A+',
    followers: 61200,
    trend: 'rising',
    topics: ['项目深度', '政策解读', '出海指南'],
    lastNotableTweet: '《从 Meme 到现实业务：Blast 的生态破圈》系列阅读量 12 万。',
  },
  {
    handle: '@DeFiLaoZhang',
    displayName: 'DeFi 老张',
    tagline: '链上收益猎人，精通风险提示。',
    totalScore: 84.3,
    qualityScore: 80,
    volumeScore: 68,
    grade: 'A+',
    followers: 35800,
    trend: 'steady',
    topics: ['DeFi', '收益策略', '风险提醒'],
    lastNotableTweet: '发布 Real Yield 调仓建议，帮助 3000+ 用户避坑。',
  },
  {
    handle: '@SolDevKit',
    displayName: 'SOL Dev Kit',
    tagline: '写合约像讲段子，开发者最爱的梗王。',
    totalScore: 82.9,
    qualityScore: 78,
    volumeScore: 69,
    grade: 'A',
    followers: 29100,
    trend: 'rising',
    topics: ['Solana', '开发教程', '安全审计'],
    lastNotableTweet: '手把手拆解某空投合约漏洞，被官方转发。',
  },
  {
    handle: '@NFTliang',
    displayName: 'NFT 梁记者',
    tagline: 'NFT 圈活百科，热度虽降但质量拉满。',
    totalScore: 79.5,
    qualityScore: 75,
    volumeScore: 63,
    grade: 'A',
    followers: 18800,
    trend: 'cooling',
    topics: ['NFT', '文化叙事', '社区运营'],
    lastNotableTweet: '盘点 Meme x NFT 联动案例，被多家项目引用。',
  },
  {
    handle: '@L2Observer',
    displayName: 'Layer2 观察员',
    tagline: '专注 Rollup 数据，周报严格 55 开。',
    totalScore: 77.8,
    qualityScore: 73,
    volumeScore: 62,
    grade: 'B+',
    followers: 22300,
    trend: 'steady',
    topics: ['Rollup', '跨链桥', '生态研报'],
    lastNotableTweet: '发布跨链桥风险矩阵，被安全团队收藏。',
  },
  {
    handle: '@CryptoMindGarden',
    displayName: '加密心流花园',
    tagline: '情绪面捕手，擅长找到下一波 Narrative。',
    totalScore: 76.1,
    qualityScore: 71,
    volumeScore: 61,
    grade: 'B+',
    followers: 16700,
    trend: 'rising',
    topics: ['叙事追踪', '情绪指标', '投研框架'],
    lastNotableTweet: '《AI x 链游》线索合集被多位 KOL 转发。',
  },
  {
    handle: '@AlphaRadar',
    displayName: 'Alpha 雷达站',
    tagline: '量化信号工厂，图表控福音。',
    totalScore: 74.2,
    qualityScore: 69,
    volumeScore: 59,
    grade: 'B',
    followers: 9500,
    trend: 'steady',
    topics: ['量化指标', '情绪图', '链上监控'],
    lastNotableTweet: '推出免费监测仪表盘，24 小时内吸粉 2k。',
  },
  {
    handle: '@DAOHotpot',
    displayName: 'DAO 火锅局',
    tagline: '社区治理提案安利官。',
    totalScore: 72.5,
    qualityScore: 67,
    volumeScore: 58,
    grade: 'B',
    followers: 14200,
    trend: 'cooling',
    topics: ['DAO', '治理', '社区工具'],
    lastNotableTweet: '点评 ENS 治理争议，引发多语种延伸讨论。',
  },
];

const scoreBuckets = [
  { label: '90 分以上', min: 90, max: 101 },
  { label: '80 - 89', min: 80, max: 90 },
  { label: '70 - 79', min: 70, max: 80 },
  { label: '70 分以下', min: 0, max: 70 },
];

const formatFollowers = (value: number) =>
  value >= 10000 ? `${(value / 10000).toFixed(1)} 万` : value.toLocaleString();

const App = () => {
  const [query, setQuery] = useState('');
  const [selectedHandle, setSelectedHandle] = useState(leaderboardData[0]?.handle ?? '');

  const filteredData = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base = [...leaderboardData];
    if (!trimmed) {
      return base.sort((a, b) => b.totalScore - a.totalScore);
    }
    return base
      .filter((entry) =>
        [entry.handle, entry.displayName, entry.topics.join(' ')].some((field) =>
          field.toLowerCase().includes(trimmed)
        )
      )
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [query]);

  useEffect(() => {
    if (!filteredData.length) {
      setSelectedHandle('');
      return;
    }
    const stillVisible = filteredData.some((item) => item.handle === selectedHandle);
    if (!stillVisible) {
      setSelectedHandle(filteredData[0].handle);
    }
  }, [filteredData, selectedHandle]);

  const bucketStats = useMemo(() => {
    const total = filteredData.length || 1;
    return scoreBuckets.map((bucket) => {
      const count = filteredData.filter(
        (item) => item.totalScore >= bucket.min && item.totalScore < bucket.max
      ).length;
      return {
        ...bucket,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }, [filteredData]);

  const columns: ColumnsType<LeaderboardEntry> = useMemo(
    () => [
      {
        title: '排名',
        dataIndex: 'rank',
        width: 70,
        render: (_value, _record, index) => <Text strong>{index + 1}</Text>,
      },
      {
        title: 'KOL',
        dataIndex: 'displayName',
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.displayName}</Text>
            <Text type="secondary">{record.handle}</Text>
          </Space>
        ),
      },
      {
        title: '综合指数',
        dataIndex: 'totalScore',
        width: 140,
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.totalScore.toFixed(1)}</Text>
            <Text type="secondary">{record.trend === 'rising' ? '🔥 升温' : record.trend === 'steady' ? '↔️ 稳定' : '🧊 降温'}</Text>
          </Space>
        ),
      },
      {
        title: '评分结构 (55/45)',
        dataIndex: 'qualityScore',
        render: (_value, record) => (
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <Text>质量 {record.qualityScore}</Text>
              <Text style={{ marginLeft: 12 }}>产出 {record.volumeScore}</Text>
            </div>
            <Progress
              percent={Math.round((record.qualityScore / (record.qualityScore + record.volumeScore)) * 100)}
              showInfo={false}
              strokeColor="#597ef7"
            />
          </div>
        ),
      },
      {
        title: '等级',
        dataIndex: 'grade',
        width: 100,
        render: (_value, record) => (
          <Tag color={record.grade === 'S' ? 'gold' : record.grade.includes('A') ? 'geekblue' : 'cyan'}>
            {record.grade}
          </Tag>
        ),
      },
      {
        title: '一句话锐评',
        dataIndex: 'tagline',
        render: (value: string) => <Text>{value}</Text>,
      },
    ],
    []
  );

  const activeEntry = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData.find((item) => item.handle === selectedHandle) ?? filteredData[0];
  }, [filteredData, selectedHandle]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      <Header style={{ background: 'transparent', padding: '24px 48px' }}>
        <Title style={{ color: 'white', marginBottom: 0 }} level={3}>
          加密货币百大 KOL 速查台
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 0 }}>
          「从夯到拉锐评」节目实时预告：综合指数 55 开，榜单随时更新。
        </Paragraph>
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <style>{`
          .kol-table .selected-row td {
            background: #f0f5ff !important;
          }
          .kol-table .ant-table-tbody > tr:hover > td {
            background: #e6f4ff !important;
          }
        `}</style>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="评分分布" bordered={false} style={{ borderRadius: 16 }}>
              <Row gutter={[16, 16]}>
                {bucketStats.map((bucket) => (
                  <Col xs={24} sm={12} md={6} key={bucket.label}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{bucket.label}</Text>
                      <Progress percent={bucket.percent} strokeColor="#52c41a" />
                      <Text type="secondary">{bucket.count} 位 KOL</Text>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={4} style={{ marginBottom: 0 }}>
                    榜单速览
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    输入 @或关键词即可筛选，点击任意行查看 KOL 速查档案。
                  </Paragraph>
                  <Input.Search
                    placeholder="输入 @handle / 昵称 / 关键词"
                    allowClear
                    size="large"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </Space>
                <Table
                  className="kol-table"
                  rowKey="handle"
                  columns={columns}
                  dataSource={filteredData}
                  pagination={false}
                  locale={{ emptyText: <Empty description="暂无匹配的 KOL" /> }}
                  onRow={(record) => ({
                    onClick: () => setSelectedHandle(record.handle),
                  })}
                  rowClassName={(record) => (record.handle === selectedHandle ? 'selected-row' : '')}
                />
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 16 }}>
              {activeEntry ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {activeEntry.displayName}
                      </Title>
                      <Text type="secondary">{activeEntry.handle}</Text>
                    </div>
                    <Tag color={activeEntry.grade === 'S' ? 'gold' : activeEntry.grade.includes('A') ? 'geekblue' : 'cyan'}>
                      {activeEntry.grade} 等级
                    </Tag>
                  </Space>
                  <Paragraph>{activeEntry.tagline}</Paragraph>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Statistic title="综合指数" value={activeEntry.totalScore} precision={1} suffix="/100" />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Statistic title="内容质量得分" value={activeEntry.qualityScore} precision={0} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Statistic title="活跃度得分" value={activeEntry.volumeScore} precision={0} />
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Statistic title="关注者" value={formatFollowers(activeEntry.followers)} />
                      </Card>
                    </Col>
                    <Col xs={24} md={16}>
                      <Card size="small" bordered={false} style={{ background: '#f5f5f5' }}>
                        <Text strong>评分结构</Text>
                        <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                          质量占比 {Math.round((activeEntry.qualityScore / (activeEntry.qualityScore + activeEntry.volumeScore)) * 100)}%，产出占比 {100 - Math.round((activeEntry.qualityScore / (activeEntry.qualityScore + activeEntry.volumeScore)) * 100)}%。
                        </Paragraph>
                        <Progress
                          percent={Math.round((activeEntry.qualityScore / (activeEntry.qualityScore + activeEntry.volumeScore)) * 100)}
                          showInfo={false}
                          strokeColor="#2f54eb"
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0' }} />
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text strong>擅长赛道</Text>
                      <Space wrap style={{ marginTop: 8 }}>
                        {activeEntry.topics.map((topic) => (
                          <Tag key={topic} color="processing">
                            #{topic}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                    <div>
                      <Text strong>最近高光</Text>
                      <Paragraph style={{ marginTop: 8 }}>{activeEntry.lastNotableTweet}</Paragraph>
                    </div>
                  </Space>
                </Space>
              ) : (
                <Empty description="请从榜单中选择一位 KOL" />
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;
