import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Space, Tag, Typography, Descriptions, Divider } from 'antd';
import { MonitoredUser } from '../types/index';

interface UserDetailDrawerProps {
  user: MonitoredUser | null;
  open: boolean;
  onClose: () => void;
  onSave: (values: { tags: string[]; notes?: string }) => void;
}

const UserDetailDrawer = ({ user, open, onClose, onSave }: UserDetailDrawerProps) => {
  const [form] = Form.useForm<{ tags: string[]; notes?: string }>();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        tags: user.tags,
        notes: user.notes,
      });
    } else {
      form.resetFields();
    }
  }, [user, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSave(values);
  };

  return (
    <Drawer
      title={user ? `@${user.twitter_handle}` : 'User details'}
      open={open}
      width={480}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <a onClick={onClose}>Close</a>
          <a onClick={handleSubmit}>Save</a>
        </Space>
      }
    >
      {user && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Display Name">{user.display_name}</Descriptions.Item>
            <Descriptions.Item label="Followers">{user.profile.followers_count ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Following">{user.profile.following_count ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Quality Score">{user.quality_rating.score}</Descriptions.Item>
            <Descriptions.Item label="Last Scan">
              {user.stats.last_scan_time ? new Date(user.stats.last_scan_time).toLocaleString() : 'N/A'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Title level={5}>Recent Mentions</Typography.Title>
            <Space size={[8, 8]} wrap>
              {user.recent_mentions.length ? (
                user.recent_mentions.map((mention) => (
                  <Tag key={mention.symbol} color="blue">
                    {mention.symbol} · {mention.mention_count}
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary">No mentions tracked yet.</Typography.Text>
              )}
            </Space>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Tags" name="tags">
              <Select mode="tags" placeholder="Add tags" tokenSeparators={[',']} />
            </Form.Item>
            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={4} placeholder="Add notes or context" />
            </Form.Item>
          </Form>

          <Divider />
          <div>
            <Typography.Title level={5}>Topics</Typography.Title>
            <Space size={[8, 8]} wrap>
              {user.main_topics.length ? (
                user.main_topics.map((topic) => (
                  <Tag key={topic} color="geekblue">
                    {topic}
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary">No topics detected yet.</Typography.Text>
              )}
            </Space>
          </div>
        </Space>
      )}
    </Drawer>
  );
};

export default UserDetailDrawer;
