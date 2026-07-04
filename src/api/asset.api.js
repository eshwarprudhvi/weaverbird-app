import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const uploadAsset = async (formData) => {
  return await apiClient.post(ENDPOINTS.ASSETS.BASE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteAsset = async (assetId) => {
  return await apiClient.delete(ENDPOINTS.ASSETS.DETAIL(assetId));
};
