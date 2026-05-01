import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Nodes
export const createNode = (labels, properties) =>
  api.post('/nodes', { labels, properties })

export const getNodes = (label, params = {}) =>
  api.get('/nodes', { params: { label, ...params } })

export const getNodeById = (id, label) =>
  api.get(`/nodes/${id}`, { params: { label } })

export const updateNodeProperties = (label, ids, properties) =>
  api.patch('/nodes/properties', { label, ids, properties })

export const removeNodeProperties = (label, ids, keys) =>
  api.delete('/nodes/properties', { data: { label, ids, keys } })

export const deleteNodes = (label, ids) =>
  api.delete('/nodes', { data: { label, ids } })

// Relationships
export const createRelationship = (data) =>
  api.post('/relationships', data)

export const getRelationships = (params = {}) =>
  api.get('/relationships', { params })

export const updateRelProperties = (elementIds, properties) =>
  api.patch('/relationships/properties', { elementIds, properties })

export const removeRelProperties = (elementIds, keys) =>
  api.delete('/relationships/properties', { data: { elementIds, keys } })

export const deleteRelationships = (elementIds) =>
  api.delete('/relationships', { data: { elementIds } })

// Import
export const importCSV = (type, file) => {
  const form = new FormData()
  form.append('type', type)
  form.append('file', file)
  return api.post('/import/csv', form)
}

// Stats & Queries
export const getStats = () => api.get('/stats')
export const getRecommendations = (userId) => api.get(`/recommendations/${userId}`)
export const runQuery = (name, params = {}) => api.get(`/queries/${name}`, { params })
export const verifyGraph = () => api.get('/graph/verify')
export const deleteIsolatedNodes = () => api.delete('/graph/isolated')
