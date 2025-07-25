import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Upload, Image, Space } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import AxiosInstances from '../../apiManager';
import toast from 'react-hot-toast';
import { Select } from 'antd';

const EditHospitalModal = ({ isOpen, onClose, hospitalData, onUpdate }) => {
  const [form] = Form.useForm();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (hospitalData) {
      form.setFieldsValue({
        ...hospitalData,
        'timings.weekdays': hospitalData.timings?.weekdays || '',
        'timings.weekends': hospitalData.timings?.weekends || ''
      });
      setImages(hospitalData.imageUrl || []);
    }
  }, [hospitalData, form]);

  const handleImageUpload = async ({ file }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await AxiosInstances.post('/admin/upload-hospital-image', formData);
      setImages(prev => [...prev, res.data.url]);
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (url) => {
  try {
    await AxiosInstances.delete('/admin/delete-hospital-image', {
      data: {
        url,
        hospitalId: hospitalData._id
      }
    });
    setImages(prev => prev.filter(img => img !== url));
    toast.success('Image removed');
  } catch (err) {
    toast.error('Failed to delete image');
  }
};


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        imageUrl: images,
        timings: {
          weekdays: values['timings.weekdays'],
          weekends: values['timings.weekends']
        }
      };
      delete payload['timings.weekdays'];
      delete payload['timings.weekends'];

      await AxiosInstances.put(`/admin/update-hospital/${hospitalData._id}`, payload);
      toast.success('Hospital updated');
      onUpdate();
      onClose();
    } catch (err) {
      toast.error('Validation or update failed');
    }
  };

  return (
    <Modal
      open={isOpen}
      title="Edit Hospital"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={uploading}
      width={720}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="Hospital Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Apollo Clinic" />
          </Form.Item>

          <Form.Item label="Location" name="location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Google Maps Link" name="googleMapsLink">
            <Input />
          </Form.Item>

          <Form.Item label="Phone Number" name="phoneNumber">
            <Input />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select placeholder="Select hospital status">
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="blocked">Blocked</Select.Option>
            </Select>
          </Form.Item>

        </div>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Describe the hospital..." />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="Weekday Timings" name="timings.weekdays">
            <Input />
          </Form.Item>

          <Form.Item label="Weekend Timings" name="timings.weekends">
            <Input />
          </Form.Item>
        </div>

        <Form.Item label="Uploaded Images">
          {images.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative">
                  <Image
                    src={`http://localhost:5000${url}`}
                    width={100}
                    height={100}
                    className="rounded object-cover"
                  />
                  <Button
                    shape="circle"
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    className="absolute top-[-8px] right-[-8px]"
                    onClick={() => handleRemoveImage(url)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 italic">No images uploaded.</div>
          )}
        </Form.Item>


        <Form.Item label="Upload New Image">
          <Upload
            customRequest={handleImageUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditHospitalModal;
