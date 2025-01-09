import { 
  RefinementResponse,
  RefinementOriginCreate,
  RefinementOriginUpdateWithId,
  RefinementTransmissionCreate,
  RefinementTransmissionUpdateWithId,
  RefinementDatioCreate,
  RefinementDatioUpdateWithId,
  RefinementDefinitionCreate,
  RefinementDefinitionUpdateWithId,
  RefinementStagingCreate,
  RefinementStagingUpdateWithId,
  RefinementRawCreate,
  RefinementRawUpdateWithId,
  RefinementMasterCreate,
  RefinementMasterUpdateWithId
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Obtener refinamiento por ID de objeto
async function getRefinementByObjectId(objectId: string): Promise<RefinementResponse | null> {
  const response = await fetch(`${API_URL}/refinements/object/${objectId}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Error al obtener refinamiento: ${response.status}`);
  return await response.json();
}

// Origin
async function createOriginRefinement(data: RefinementOriginCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/origin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento de origen');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento de origen:', error);
    throw error;
  }
}

async function updateOriginRefinement(data: RefinementOriginUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/origin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento de origen');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento de origen:', error);
    throw error;
  }
}

// Transmission
async function createTransmissionRefinement(data: RefinementTransmissionCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/transmission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento de transmisión');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento de transmisión:', error);
    throw error;
  }
}

async function updateTransmissionRefinement(data: RefinementTransmissionUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/transmission`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento de transmisión');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento de transmisión:', error);
    throw error;
  }
}

// Datio
async function createDatioRefinement(data: RefinementDatioCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/datio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento de datio');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento de datio:', error);
    throw error;
  }
}

async function updateDatioRefinement(data: RefinementDatioUpdateWithId): Promise<RefinementDatioUpdateWithId> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/datio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento de datio');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento de datio:', error);
    throw new Error('Error al actualizar refinamiento de datio');
  }
};

// Definition
async function createDefinitionRefinement(data: RefinementDefinitionCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/definition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento de definición');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento de definición:', error);
    throw error;
  }
}

async function updateDefinitionRefinement(data: RefinementDefinitionUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/definition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento de definición');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento de definición:', error);
    throw error;
  }
}

// Staging
async function createStagingRefinement(data: RefinementStagingCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/staging`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento de staging');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento de staging:', error);
    throw error;
  }
}

async function updateStagingRefinement(data: RefinementStagingUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/staging`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento de staging');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento de staging:', error);
    throw error;
  }
}

// Raw
async function createRawRefinement(data: RefinementRawCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento raw');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento raw:', error);
    throw error;
  }
}

async function updateRawRefinement(data: RefinementRawUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/raw`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento raw');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento raw:', error);
    throw error;
  }
}

// Master
async function createMasterRefinement(data: RefinementMasterCreate): Promise<RefinementResponse> {
  try {
    const response = await fetch(`${API_URL}/refinements/master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear refinamiento master');
    return await response.json();
  } catch (error) {
    console.error('Error al crear refinamiento master:', error);
    throw error;
  }
}

async function updateMasterRefinement(data: RefinementMasterUpdateWithId): Promise<RefinementResponse> {
  try {
    const { id_refinement, ...updateData } = data;
    const response = await fetch(`${API_URL}/refinements/${id_refinement}/master`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Error al actualizar refinamiento master');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar refinamiento master:', error);
    throw error;
  }
}

// Delete refinement
async function deleteRefinement(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/refinements/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar refinamiento');
  } catch (error) {
    console.error('Error al eliminar refinamiento:', error);
    throw error;
  }
}

export {
  getRefinementByObjectId,
  createOriginRefinement,
  updateOriginRefinement,
  createTransmissionRefinement,
  updateTransmissionRefinement,
  createDatioRefinement,
  updateDatioRefinement,
  createDefinitionRefinement,
  updateDefinitionRefinement,
  createStagingRefinement,
  updateStagingRefinement,
  createRawRefinement,
  updateRawRefinement,
  createMasterRefinement,
  updateMasterRefinement,
  deleteRefinement
}; 