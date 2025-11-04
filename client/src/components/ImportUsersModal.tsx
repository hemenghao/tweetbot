import { useState } from 'react';
import { Modal, Upload, message, Typography, Button } from 'antd';
import type { UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { importUsersFromFile } from '../services/api';

const { Dragger } = Upload;

interface ImportUsersModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportUsersModal = ({ open, onClose, onSuccess }: ImportUsersModalProps) => {
  const [uploading, setUploading] = useState(false);

  const props: UploadProps = {
    multiple: false,
    accept: '.csv,.json',
    beforeUpload: () => false,
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      await importUsersFromFile(file);
      message.success('Import successful');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      message.error('Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Import Users"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Typography.Paragraph>
        Upload a CSV or JSON file with <code>twitter_handle</code> and optional <code>display_name</code> columns.
      </Typography.Paragraph>
      <Dragger
        {...props}
        disabled={uploading}
        customRequest={async ({ file, onSuccess: success }) => {
          await handleUpload(file as File);
          success?.('ok');
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">Supports CSV or JSON. Max size 2MB.</p>
      </Dragger>
      <Button onClick={onClose} style={{ marginTop: 16 }} block>
        Cancel
      </Button>
    </Modal>
  );
};

export default ImportUsersModal;
