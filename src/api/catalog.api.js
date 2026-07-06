import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const createCatalogItem = async (data) => {
  return await apiClient.post(ENDPOINTS.CATALOG.LIST, data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const updateCatalogItem = async (itemId, data) => {
  return await apiClient.patch(ENDPOINTS.CATALOG.DETAIL(itemId), data, {
    headers: { 'X-API-Version': '2' }
  });
};

export const deleteCatalogItem = async (itemId) => {
  return await apiClient.delete(ENDPOINTS.CATALOG.DETAIL(itemId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const getCatalogItem = async (itemId) => {
  return await apiClient.get(ENDPOINTS.CATALOG.DETAIL(itemId), {
    headers: { 'X-API-Version': '2' }
  });
};

export const listCatalog = async (query = {}) => {
  return await apiClient.get(ENDPOINTS.CATALOG.LIST, {
    params: query,
    headers: { 'X-API-Version': '2' }
  });
};
